package services

import (
	"context"
	"log"

	"github.com/erneap/scheduler/schedulerApi/models/config"
	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/users"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Every service will have functions for completing the CRUD functions
// the retrieve functions will be for individual user and the whole list of
// users.

// CRUD Create function
func CreateUser(email, first, middle, last, password string) *users.User {
	userCol := config.GetCollection(config.DB, "authenticate", "users")
	empCol := config.GetCollection(config.DB, "scheduler", "employees")

	filter := bson.M{
		"firstName": first,
		"lastName":  last,
	}

	var user users.User
	if err := userCol.FindOne(context.TODO(), filter).Decode(&user); err != nil {
		user = users.User{
			EmailAddress: email,
			FirstName:    first,
			MiddleName:   middle,
			LastName:     last,
		}
		eFilter := bson.M{
			"name.firstname": first,
			"name.lastname":  last,
		}
		var emp employees.Employee
		empCol.FindOne(context.TODO(), eFilter).Decode(&emp)
		if emp.ID != primitive.NilObjectID {
			user.ID = emp.ID
		} else {
			user.ID = primitive.NewObjectID()
		}
		user.SetPassword(password)
		userCol.InsertOne(context.TODO(), emp)
	} else {
		filter = bson.M{
			"_id": user.ID,
		}
		user.EmailAddress = email
		user.FirstName = first
		user.MiddleName = middle
		user.LastName = last
		user.SetPassword(password)

		userCol.ReplaceOne(context.TODO(), filter, user)
	}
	return &user
}

// CRUD Retrieve Functions (One and ALL)
func GetUser(id primitive.ObjectID) *users.User {
	var user *users.User

	filter := bson.M{
		"_id": id,
	}

	err := config.GetCollection(config.DB, "authenticate", "users").
		FindOne(context.TODO(), filter).Decode(user)
	if err != nil {
		log.Println(err)
		return nil
	}

	return user
}

func GetUserByEmail(emailAddress string) (*users.User, error) {
	var user *users.User

	filter := bson.M{
		"emailAddress": emailAddress,
	}

	err := config.GetCollection(config.DB, "authenticate", "users").
		FindOne(context.TODO(), filter).Decode(user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func GetUsers() []users.User {
	var users []users.User

	userCol := config.GetCollection(config.DB, "authenticate", "users")

	cursor, err := userCol.Find(context.TODO(), bson.M{})
	if err != nil {
		log.Println(err)
		return users
	}

	if err = cursor.All(context.TODO(), &users); err != nil {
		log.Println(err)
	}
	return users
}

// CRUD Update Function
func UpdateUser(user users.User) error {
	userCol := config.GetCollection(config.DB, "authenticate", "users")

	filter := bson.M{
		"_id": user.ID,
	}

	_, err := userCol.ReplaceOne(context.TODO(), filter, user)
	return err
}

// CRUD Delete Function
func DeleteUser(id primitive.ObjectID) error {
	userCol := config.GetCollection(config.DB, "authenticate", "users")

	filter := bson.M{
		"_id": id,
	}

	_, err := userCol.DeleteOne(context.TODO(), filter)
	return err
}
