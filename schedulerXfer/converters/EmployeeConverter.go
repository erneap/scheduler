package converters

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerXfer/models/config"
	"github.com/erneap/scheduler/schedulerXfer/models/employees"
	"github.com/erneap/scheduler/schedulerXfer/models/sites"
	"github.com/erneap/scheduler/schedulerXfer/models/users"
	"github.com/xuri/excelize/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EmployeeConverter struct {
	BaseLocation string
	Users        []users.User
	TeamID       primitive.ObjectID
	SiteID       string
	Employees    []employees.Employee
	EmployeeWork []employees.EmployeeWorkRecord
}

func (e *EmployeeConverter) GetTeamInfo() {
	teamCol := config.GetCollection(config.DB, "scheduler", "teams")

	var team sites.Team

	filter := bson.M{"name": "DCGS Field Support"}
	teamCol.FindOne(context.TODO(), filter).Decode(&team)
	e.TeamID = team.ID

	e.GetUsers()
}

func (e *EmployeeConverter) GetUsers() {
	cursor, err := config.GetCollection(config.DB, "authenticate", "users").Find(
		context.TODO(), bson.M{})
	if err != nil {
		fmt.Println(err)
	}

	if err = cursor.All(context.TODO(), &e.Users); err != nil {
		fmt.Println(err)
	}
}

func (e *EmployeeConverter) ReadEmployees() {
	log.Println("Reading Employees")

	// i'm only interested in dates from 2022 forward
	baseDate := time.Date(2021, 12, 31, 23, 59, 59, 0, time.UTC)
	zeroDate := time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)

	if e.BaseLocation == "" {
		log.Fatal("Base Location is empty")
	}

	path := filepath.Join(e.BaseLocation, "Employees.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("Emplooyees not present")
	}

	f, err := excelize.OpenFile(path)
	if err != nil {
		log.Fatal(err)
	}

	defer func() {
		if err := f.Close(); err != nil {
			log.Println(err)
		}
	}()

	// create map of column headers
	columns := make(map[string]int)

	rows, err := f.GetRows("Employees")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colCell := range row {
				columns[colCell] = j
			}
		} else {
			endDate := ParseDate(row[columns["EndDate"]])
			company := row[columns["Company"]]
			if strings.EqualFold(company, "raytheon") {
				company = "rtx"
			} else {
				company = strings.ToLower(company)
			}
			if endDate.Equal(zeroDate) || endDate.After(baseDate) {
				emp := employees.Employee{
					TeamID: e.TeamID,
					SiteID: "dgsc",
					Name: employees.EmployeeName{
						FirstName:  row[columns["FirstName"]],
						MiddleName: row[columns["MiddleName"]],
						LastName:   row[columns["LastName"]],
					},
					Data: employees.EmployeeData{
						CompanyInfo: employees.CompanyInfo{
							Company:     company,
							EmployeeID:  row[columns["EmployeeID"]],
							AlternateID: row[columns["PeoplesoftID"]],
							JobTitle:    row[columns["JobTitle"]],
							Rank:        row[columns["LaborCategory"]],
							CostCenter:  row[columns["CostCenter"]],
							Division:    row[columns["SubCompany"]],
						},
					},
				}
				startDate := ParseDate(row[columns["StartDate"]])
				if endDate.Equal(zeroDate) {
					endDate = time.Date(9999, 12, 30, 0, 0, 0, 0, time.UTC)
				}
				wkCtr := row[columns["WorkCenter"]]
				if strings.Contains(wkCtr, "Lead") {
					wkCtr = "leads"
				} else if strings.EqualFold(wkCtr, "hb/lb") {
					wkCtr = "xint"
				} else {
					wkCtr = strings.ToLower(wkCtr)
				}
				asgmt := employees.Assignment{
					ID:         uint(1),
					Site:       "dgsc",
					Workcenter: wkCtr,
					StartDate:  startDate,
					EndDate:    endDate,
				}
				asgmt.AddSchedule(7)
				if ParseInt(row[columns["ScheduleChangeFreq"]]) > 0 {
					asgmt.RotationDays = ParseInt(row[columns["ScheduleChangeFreq"]])
					asgmt.RotationDate = ParseDate(row[columns["ScheduleChangeDate"]])
					asgmt.AddSchedule(7)
				}
				e.Employees = append(e.Employees, emp)
			}
		}
	}
}
