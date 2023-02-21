package converters

import (
	"context"
	"fmt"

	"github.com/erneap/scheduler/schedulerXfer/models/config"
	"github.com/erneap/scheduler/schedulerXfer/models/users"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// The user converter will process the users from the already present metrics
// database, user collection to an independent authenticate database, user collection
// and adjust the permissions from metrics only to program-permission groupings.

type UserConverter struct {
	Users []users.User
}

func (u *UserConverter) ReadUsers() {
	metricsUsersCollection := config.GetCollection(config.DB, "metrics", "users")

	cursor, err := metricsUsersCollection.Find(context.TODO(), bson.M{})
	if err != nil {
		fmt.Println(err)
	}

	if err = cursor.All(context.TODO(), &u.Users); err != nil {
		fmt.Println(err)
	}
}

func (u *UserConverter) WriteUsers() {
	// delete all users currently in database
	newCol := config.GetCollection(config.DB, "authenticate", "users")
	if len(u.Users) == 0 {
		user := users.User{
			ID:           primitive.NewObjectID(),
			EmailAddress: "antonerne@yahoo.com",
			FirstName:    "Anton",
			MiddleName:   "Peter",
			LastName:     "Erne",
			Workgroups: []string{"scheduler-employee", "scheduler-admin",
				"scheduler-scheduler"},
		}
		user.SetPassword("mko09IJNbhu8")
		u.Users = append(u.Users, user)
	}
	newCol.DeleteMany(context.TODO(), bson.M{})

	for _, usr := range u.Users {
		for i, perm := range usr.Workgroups {
			usr.Workgroups[i] = "metrics-" + perm
		}
		usr.Workgroups = append(usr.Workgroups, "scheduler-employee")
		newCol.InsertOne(context.TODO(), usr)
	}
}
