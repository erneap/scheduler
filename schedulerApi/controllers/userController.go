package controllers

import (
	"log"
	"net/http"
	"strings"

	"github.com/erneap/scheduler/schedulerApi/middleware"
	"github.com/erneap/scheduler/schedulerApi/models/users"
	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func Login(c *gin.Context) {
	var data web.AuthenticationRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "Trouble with request"})
		return
	}

	user, err := services.GetUserByEmail(data.EmailAddress)
	if err != nil {
		log.Println(err.Error())
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "User not found"})
		return
	}

	if err := user.Authenticate(data.Password); err != nil {
		exception := err.Error()
		err := services.UpdateUser(*user)
		if err != nil {
			c.JSON(http.StatusNotFound,
				web.AuthenticationResponse{User: &users.User{},
					Token: "", Exception: "Problem Updating Database"})
			return
		}
		c.JSON(http.StatusUnauthorized,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: exception})
		return
	}
	err = services.UpdateUser(*user)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "Problem Updating Database"})
		return
	}

	// create token
	tokenString, err := middleware.CreateToken(user.ID, user.EmailAddress)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "Problem creating JWT Token"})
		return
	}

	// get Employee record for user if available
	emp, err := services.GetEmployee(user.ID.Hex())
	if err != nil {
		if err != mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound,
				web.AuthenticationResponse{User: &users.User{},
					Token: "", Exception: err.Error()})
		} else {
			log.Println(err.Error())
			c.JSON(http.StatusNotFound,
				web.AuthenticationResponse{User: &users.User{},
					Token: "", Exception: err.Error()})
		}
	}
	emp.Email = user.EmailAddress

	team, err := services.GetTeam(emp.TeamID.Hex())
	if err != nil {
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: err.Error()})
	}

	site, err := services.GetSite(team.ID.Hex(), emp.SiteID)
	if err != nil {
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: err.Error()})
	}

	users := services.GetUsers()

	emps, _ := services.GetEmployees(team.ID.Hex(), emp.SiteID)
	site.Employees = site.Employees[:0]
	if len(emps) > 0 {
		for _, emp := range emps {
			for _, usr := range users {
				if usr.ID == emp.ID {
					emp.Email = usr.EmailAddress
				}
			}
			site.Employees = append(site.Employees, emp)
		}
	}

	answer := web.AuthenticationResponse{
		User:      user,
		Token:     tokenString,
		Employee:  emp,
		Team:      team,
		Site:      site,
		Exception: "",
	}
	c.JSON(http.StatusOK, answer)
}

func ChangePassword(c *gin.Context) {
	var data web.ChangePasswordRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "Trouble with request"})
		return
	}

	id, err := primitive.ObjectIDFromHex(data.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: err.Error()})
		return
	}

	user := services.GetUser(id)
	if user != nil {
		user.SetPassword(data.Password)
	}

	err = services.UpdateUser(*user)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "Problem Updating Database"})
		return
	}
	c.JSON(http.StatusOK, web.Message{Message: "Password Changed"})
}

func ChangeUser(c *gin.Context) {
	var data web.UpdateRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "Trouble with request"})
		return
	}

	id, err := primitive.ObjectIDFromHex(data.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "Couldn't convert to ObjectID"})
		return
	}

	user := services.GetUser(id)
	if user == nil {
		log.Println(err)
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "User not found"})
		return
	}

	switch strings.ToLower(data.Field) {
	case "email", "emailaddress":
		user.EmailAddress = data.StringValue()
	case "first", "firstname":
		user.FirstName = data.StringValue()
	case "middle", "middlename":
		user.MiddleName = data.StringValue()
	case "last", "lastname":
		user.LastName = data.StringValue()
	}

	emp, _ := services.GetEmployee(data.ID)
	if emp != nil {
		switch strings.ToLower(data.Field) {
		case "first", "firstname":
			emp.Name.FirstName = data.StringValue()
		case "middle", "middlename":
			emp.Name.MiddleName = data.StringValue()
		case "last", "lastname":
			emp.Name.LastName = data.StringValue()
		}
		services.UpdateEmployee(emp)
	}

	err = services.UpdateUser(*user)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &users.User{},
				Token: "", Exception: "Problem Updating Database"})
		return
	}
	tokenString, _ := middleware.CreateToken(user.ID, user.EmailAddress)
	c.JSON(http.StatusOK, web.AuthenticationResponse{
		User: user, Token: tokenString, Exception: "", Employee: emp})
}
