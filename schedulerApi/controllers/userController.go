package controllers

import (
	"log"
	"net/http"

	"github.com/erneap/metrics-api/middleware"
	"github.com/erneap/metrics-api/models/interfaces"
	"github.com/erneap/scheduler/schedulerApi/models/config"
	"github.com/erneap/scheduler/schedulerApi/models/users"
	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
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
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &interfaces.User{},
				Token: "", Exception: "User not found"})
		return
	}
	if err := user.Authenticate(data.Password); err != nil {
		exception := err.Error()
		_, err := config.GetCollection(config.DB, "users").ReplaceOne(ctx,
			bson.M{"_id": user.ID}, &user)
		if err != nil {
			c.JSON(http.StatusNotFound,
				web.AuthenticationResponse{User: &interfaces.User{},
					Token: "", Exception: "Problem Updating Database"})
			return
		}
		c.JSON(http.StatusUnauthorized,
			web.AuthenticationResponse{User: &interfaces.User{},
				Token: "", Exception: exception})
		return
	}
	err = services.UpdateUser(*user)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &interfaces.User{},
				Token: "", Exception: "Problem Updating Database"})
		return
	}

	// create token
	tokenString, err := middleware.CreateToken(user.ID, user.EmailAddress)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusNotFound,
			web.AuthenticationResponse{User: &interfaces.User{},
				Token: "", Exception: "Problem creating JWT Token"})
		return
	}

}
