package services

import (
	"context"
	"log"

	"github.com/erneap/scheduler/schedulerApi/models/config"
	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/users"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Every service will have functions for completing the CRUD functions
// the retrieve functions will be for individual employee and the whole list of
// site's employees

// Create Employee
// Most employees will have a log in account to allow them to view the
// schedule data.  So a comparison of their possible authentication account is
// made to ensure their object ID is the same.
func CreateEmployee(first, middle, last, teamID, siteid string) (*employees.Employee, error) {
	userCol := config.GetCollection(config.DB, "authenticate", "users")
	empCol := config.GetCollection(config.DB, "scheduler", "employees")

	filter := bson.M{
		"name.firstName": first,
		"name.lastName":  last,
	}

	// first check to see of an employee already exists for this first and last
	// name.  If present, change filter to include middle if not blank, but if
	// middle is blank, return old employee record
	var emp employees.Employee
	err := empCol.FindOne(context.TODO(), filter).Decode(&emp)
	if err == nil || err != mongo.ErrNoDocuments {
		if middle == "" {
			emp.Decrypt()
			return &emp, nil
		}
		filter = bson.M{
			"name.firstName":  first,
			"name.middleName": middle,
			"name.lastName":   last,
		}

		err = empCol.FindOne(context.TODO(), filter).Decode(&emp)
		if err == nil || err != mongo.ErrNoDocuments {
			emp.Decrypt()
			return &emp, nil
		}
	}

	emp.TeamID, _ = primitive.ObjectIDFromHex(teamID)
	emp.SiteID = siteid
	emp.Name = employees.EmployeeName{
		FirstName:  first,
		MiddleName: middle,
		LastName:   last,
	}
	filter = bson.M{
		"firstName": first,
		"lastName":  last,
	}

	var user users.User

	err = userCol.FindOne(context.TODO(), filter).Decode(&user)
	if err == mongo.ErrNoDocuments {
		emp.ID = primitive.NewObjectID()
	} else {
		emp.ID = user.ID
	}

	_, err = empCol.InsertOne(context.TODO(), emp)
	if err != nil {
		return nil, err
	}
	return &emp, nil
}

func GetEmployee(id string) (*employees.Employee, error) {
	empCol := config.GetCollection(config.DB, "scheduler", "employees")

	oEmpID, _ := primitive.ObjectIDFromHex(id)
	filter := bson.M{
		"_id": oEmpID,
	}

	var emp employees.Employee
	err := empCol.FindOne(context.TODO(), filter).Decode(&emp)
	if err != nil {
		return nil, err
	}
	emp.Decrypt()
	return &emp, nil
}

func GetEmployees(teamid, siteid string) ([]employees.Employee, error) {
	empCol := config.GetCollection(config.DB, "scheduler", "employees")

	oTID, _ := primitive.ObjectIDFromHex(teamid)
	filter := bson.M{
		"team": oTID,
		"site": siteid,
	}

	var employees []employees.Employee

	cursor, err := empCol.Find(context.TODO(), filter)
	if err != nil {
		return employees[:0], err
	}

	if err = cursor.All(context.TODO(), &employees); err != nil {
		log.Println(err)
	}

	for i, emp := range employees {
		emp.Decrypt()
		employees[i] = emp
	}

	return employees, nil
}

func UpdateEmployee(emp employees.Employee) error {
	empCol := config.GetCollection(config.DB, "scheduler", "employees")

	filter := bson.M{
		"_id": emp.ID,
	}

	_, err := empCol.ReplaceOne(context.TODO(), filter, emp)
	return err
}

func DeleteEmployee(empID string) error {
	empCol := config.GetCollection(config.DB, "scheduler", "employees")

	oEmpID, _ := primitive.ObjectIDFromHex(empID)
	filter := bson.M{
		"_id": oEmpID,
	}

	_, err := empCol.DeleteOne(context.TODO(), filter)
	return err
}
