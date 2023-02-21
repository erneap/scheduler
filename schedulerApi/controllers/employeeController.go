package controllers

import (
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetEmployee(c *gin.Context) {
	empID := c.Param("empid")

	emp, err := services.GetEmployee(empID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func CreateEmployee(c *gin.Context) {
	var data web.NewEmployeeRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	// The service checks for the employee and updates if present in the database,
	// but if not present, creates a new employee.
	emp, err := services.CreateEmployee(data.First, data.Middle, data.Last,
		data.TeamID, data.SiteID)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
	}
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

// basic update includes name and company information which is unlike to change
// much.
func UpdateEmployeeBasic(c *gin.Context) {
	var data web.UpdateRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	// Get the Employee through the data service
	emp, err := services.GetEmployee(data.ID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	// update the corresponding field
	switch strings.ToLower(data.Field) {
	case "first", "firstname":
		emp.Name.FirstName = data.StringValue()
	case "middle", "middlename":
		emp.Name.MiddleName = data.StringValue()
	case "last", "lastname":
		emp.Name.LastName = data.StringValue()
	case "suffix":
		emp.Name.Suffix = data.StringValue()
	case "company":
		emp.Data.CompanyInfo.Company = data.StringValue()
	case "employeeid", "companyid":
		emp.Data.CompanyInfo.EmployeeID = data.StringValue()
	case "alternateid", "alternate":
		emp.Data.CompanyInfo.AlternateID = data.StringValue()
	case "jobtitle", "title":
		emp.Data.CompanyInfo.JobTitle = data.StringValue()
	case "rank", "grade":
		emp.Data.CompanyInfo.Rank = data.StringValue()
	case "costcenter":
		emp.Data.CompanyInfo.CostCenter = data.StringValue()
	case "division":
		emp.Data.CompanyInfo.Division = data.StringValue()
	}

	// send the employee back to the service for update.
	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func CreateEmployeeAssignment(c *gin.Context) {
	var newAsgmt web.NewEmployeeAssignment

	if err := c.ShouldBindJSON(&newAsgmt); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	// get the employee from the id provided
	emp, err := services.GetEmployee(newAsgmt.EmployeeID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}
	sort.Sort(employees.ByAssignment(emp.Data.Assignments))
	lastAssignment := emp.Data.Assignments[len(emp.Data.Assignments)-1]
	lastAssignment.EndDate = newAsgmt.StartDate.AddDate(0, 0, -1)

	asgmt := employees.Assignment{
		ID:           uint(len(emp.Data.Assignments)),
		Site:         newAsgmt.SiteID,
		Workcenter:   newAsgmt.Workcenter,
		StartDate:    newAsgmt.StartDate,
		EndDate:      time.Date(9999, 12, 30, 23, 59, 59, 0, time.UTC),
		RotationDate: newAsgmt.StartDate,
		RotationDays: 0,
	}
	asgmt.AddSchedule(newAsgmt.ScheduleDays)
	emp.Data.Assignments = append(emp.Data.Assignments, asgmt)

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func UpdateEmployeeAssignment(c *gin.Context) {
	var data web.ChangeAssignmentRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(data.EmployeeID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	for i, asgmt := range emp.Data.Assignments {
		if asgmt.ID == data.AssignmentID {
			switch strings.ToLower(data.Field) {
			case "site":
				asgmt.Site = data.StringValue()
			case "workcenter":
				asgmt.Workcenter = data.StringValue()
			case "start", "startdate":
				asgmt.StartDate = data.DateValue()
			case "end", "enddate":
				asgmt.EndDate = data.DateValue()
			case "rotationdate":
				asgmt.RotationDate = data.DateValue()
			case "rotationdays":
				asgmt.RotationDays = data.IntValue()
			case "addschedule":
				asgmt.AddSchedule(data.IntValue())
			case "changeschedule":
				asgmt.ChangeScheduleDays(data.ScheduleID, data.IntValue())
			case "removeschedule":
				asgmt.RemoveSchedule(data.ScheduleID)
			}
			emp.Data.Assignments[i] = asgmt
		}
	}

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func UpdateEmployeeAssignmentWorkday(c *gin.Context) {
	var data web.ChangeAssignmentRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(data.EmployeeID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	for i, asgmt := range emp.Data.Assignments {
		if asgmt.ID == data.AssignmentID {
			for j, sch := range asgmt.Schedules {
				if sch.ID == data.ScheduleID {
					for k, wd := range sch.Workdays {
						if wd.ID == data.WorkdayID {
							switch strings.ToLower(data.Field) {
							case "workcenter":
								wd.Workcenter = data.StringValue()
							case "code":
								wd.Code = data.StringValue()
							case "hours":
								wd.Hours = data.FloatValue()
							}
							sch.Workdays[k] = wd
							asgmt.Schedules[j] = sch
							emp.Data.Assignments[i] = asgmt
						}
					}
				}
			}
		}
	}

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func DeleteEmployeeAssignment(c *gin.Context) {
	empID := c.Param("empid")
	asgmtID, err := strconv.ParseUint(c.Param("asgmtid"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	emp, err := services.GetEmployee(empID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}
	emp.RemoveAssignment(uint(asgmtID))

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func DeleteEmployee(c *gin.Context) {
	empID := c.Param("empid")

	err := services.DeleteEmployee(empID)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.Message{Message: err.Error()})
	}
	c.JSON(http.StatusOK, web.Message{Message: "employee deleted"})
}

func CreateEmployeeVariation(c *gin.Context) {
	var data web.NewEmployeeVariation

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	data.DaysOff = strings.ToLower(data.DaysOff)
	emp, err := services.GetEmployee(data.EmployeeID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	max := uint(0)
	for _, vari := range emp.Data.Variations {
		if vari.ID > max {
			max = vari.ID
		}
	}

	variation := employees.Variation{
		ID:        max + 1,
		Site:      data.SiteID,
		IsMids:    data.IsMids,
		StartDate: data.StartDate,
		EndDate:   data.EndDate,
	}
	variation.SetScheduleDays()
	sort.Sort(employees.ByWorkday(variation.Schedule.Workdays))

	start := time.Date(variation.StartDate.Year(), variation.StartDate.Month(),
		variation.StartDate.Day(), 0, 0, 0, 0, time.UTC)
	for start.Weekday() != time.Sunday {
		start = start.AddDate(0, 0, -1)
	}
	count := uint(0)
	for start.Before(variation.EndDate) || start.Equal(variation.EndDate) {
		count++
		wd := variation.Schedule.Workdays[count]
		if start.Equal(variation.StartDate) || start.After(variation.StartDate) {
			if (start.Weekday() == time.Sunday && (data.DaysOff != "ss" &&
				data.DaysOff != "sm" && data.DaysOff != "fss" && data.DaysOff != "ssm" &&
				data.DaysOff != "smt")) ||
				(start.Weekday() == time.Monday && (data.DaysOff != "mt" &&
					data.DaysOff != "sm" && data.DaysOff != "mtw" && data.DaysOff != "ssm" &&
					data.DaysOff != "smt")) ||
				(start.Weekday() == time.Tuesday && (data.DaysOff != "mt" &&
					data.DaysOff != "tw" && data.DaysOff != "mtw" && data.DaysOff != "twt" &&
					data.DaysOff != "smt")) ||
				(start.Weekday() == time.Wednesday && (data.DaysOff != "tw" &&
					data.DaysOff != "wt" && data.DaysOff != "mtw" && data.DaysOff != "twt" &&
					data.DaysOff != "wtf")) ||
				(start.Weekday() == time.Thursday && (data.DaysOff != "wt" &&
					data.DaysOff != "tf" && data.DaysOff != "twt" && data.DaysOff != "wtf" &&
					data.DaysOff != "tfs")) ||
				(start.Weekday() == time.Friday && (data.DaysOff != "tf" &&
					data.DaysOff != "fs" && data.DaysOff != "wtf" && data.DaysOff != "tfs" &&
					data.DaysOff != "fss")) ||
				(start.Weekday() == time.Saturday && (data.DaysOff != "fs" &&
					data.DaysOff != "ss" && data.DaysOff != "tfs" && data.DaysOff != "fss" &&
					data.DaysOff != "ssm")) {
				wd.Workcenter = data.Workcenter
				wd.Code = data.Code
				wd.Hours = data.Hours
			} else {
				wd.Workcenter = ""
				wd.Code = ""
				wd.Hours = float64(0.0)
			}
		}
		variation.Schedule.Workdays[count] = wd
		start = start.AddDate(0, 0, 1)
	}

	emp.Data.Variations = append(emp.Data.Variations, variation)
	sort.Sort(employees.ByVariation(emp.Data.Variations))

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func UpdateEmployeeVariation(c *gin.Context) {
	var data web.ChangeAssignmentRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(data.EmployeeID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	for i, vari := range emp.Data.Variations {
		if vari.ID == data.AssignmentID {
			switch strings.ToLower(data.Field) {
			case "site":
				vari.Site = data.StringValue()
			case "mids", "ismids":
				vari.IsMids = data.BooleanValue()
			case "start", "startdate":
				vari.StartDate = data.DateValue()
			case "end", "enddate":
				vari.EndDate = data.DateValue()
			case "resetschedule":
				workcenter := ""
				code := ""
				hours := 0.0
				var workdays []time.Weekday
				start := time.Date(vari.StartDate.Year(), vari.StartDate.Month(),
					vari.StartDate.Day(), 0, 0, 0, 0, time.UTC)
				for start.Weekday() != time.Sunday {
					start = start.AddDate(0, 0, -1)
				}
				for i, wd := range vari.Schedule.Workdays {
					wDate := start.AddDate(0, 0, i)
					if hours <= 0.0 && wd.Hours > 0.0 {
						workcenter = wd.Workcenter
						code = wd.Code
						hours = wd.Hours
						found := false
						for _, wday := range workdays {
							if wday == wDate.Weekday() {
								found = true
							}
						}
						if !found {
							workdays = append(workdays, wDate.Weekday())
						}
					}
				}
				vari.SetScheduleDays()
				sort.Sort(employees.ByWorkday(vari.Schedule.Workdays))

				count := uint(0)
				for start.Before(vari.EndDate) || start.Equal(vari.EndDate) {
					count++
					wd := vari.Schedule.Workdays[count]
					if start.Equal(vari.StartDate) || start.After(vari.StartDate) {
						found := false
						for _, wDay := range workdays {
							if start.Weekday() == wDay {
								found = true
							}
						}
						if found {
							wd.Workcenter = workcenter
							wd.Code = code
							wd.Hours = hours
						} else {
							wd.Workcenter = ""
							wd.Code = ""
							wd.Hours = float64(0.0)
						}
					}
					vari.Schedule.Workdays[count] = wd
					start = start.AddDate(0, 0, 1)
				}
			}
		}
		emp.Data.Variations[i] = vari
	}

	sort.Sort(employees.ByVariation(emp.Data.Variations))

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func UpdateEmployeeVariationWorkday(c *gin.Context) {
	var data web.ChangeAssignmentRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(data.EmployeeID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	for i, vari := range emp.Data.Variations {
		if vari.ID == data.AssignmentID {
			for k, wd := range vari.Schedule.Workdays {
				if wd.ID == data.WorkdayID {
					switch strings.ToLower(data.Field) {
					case "workcenter":
						wd.Workcenter = data.StringValue()
					case "code":
						wd.Code = data.StringValue()
					case "hours":
						wd.Hours = data.FloatValue()
					}
					vari.Schedule.Workdays[k] = wd
					emp.Data.Variations[i] = vari
				}
			}
		}
	}

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func DeleteEmployeeVariation(c *gin.Context) {
	empID := c.Param("empid")
	variID, err := strconv.ParseUint(c.Param("variid"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(empID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	pos := -1
	for i, vari := range emp.Data.Variations {
		if vari.ID == uint(variID) {
			pos = i
		}
	}
	if pos >= 0 {
		emp.Data.Variations = append(emp.Data.Variations[:pos],
			emp.Data.Variations[pos+1:]...)
	}

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func CreateEmployeeLeaveBalance(c *gin.Context) {
	var data web.LeaveBalanceRequest
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(data.EmployeeID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	found := false
	for i, lb := range emp.Data.Balances {
		if lb.Year == data.Year {
			found = true
			if data.AnnualLeave >= 0.0 {
				lb.Annual = data.AnnualLeave
			}
			if data.CarryOver >= 0.0 {
				lb.Carryover = data.CarryOver
			}
			emp.Data.Balances[i] = lb
		}
	}
	if !found {
		balance := employees.AnnualLeave{
			Year:      data.Year,
			Annual:    data.AnnualLeave,
			Carryover: data.CarryOver,
		}
		emp.Data.Balances = append(emp.Data.Balances, balance)
	}

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func DeleteEmployeeLeaveBalance(c *gin.Context) {
	empID := c.Param("empid")
	year, err := strconv.ParseInt(c.Param("year"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(empID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	pos := -1
	for i, bal := range emp.Data.Balances {
		if bal.Year == int(year) {
			pos = i
		}
	}
	if pos >= 0 {
		emp.Data.Balances = append(emp.Data.Balances[:pos],
			emp.Data.Balances[pos+1:]...)
	}

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func CreateEmployeeLeaveRequest(c *gin.Context) {
	var data web.EmployeeLeaveRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(data.EmployeeID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	site, _ := services.GetSite(emp.TeamID.Hex(), emp.SiteID)
	data.StartDate = data.StartDate.Add(time.Hour * time.Duration(site.UtcOffset))
	data.EndDate = data.EndDate.Add(time.Hour * time.Duration(site.UtcOffset))
	emp.NewLeaveRequest(data.EmployeeID, data.Code, data.StartDate,
		data.EndDate)

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func UpdateEmployeeLeaveRequest(c *gin.Context) {
	var data web.UpdateRequest
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(data.ID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}
	site, _ := services.GetSite(emp.TeamID.Hex(), emp.SiteID)
	offset := 0.0
	if site != nil {
		offset = site.UtcOffset
	}

	err = emp.UpdateLeaveRequest(data.OptionalID, data.Field,
		data.StringValue(), offset)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func DeleteEmployeeLeaveRequest(c *gin.Context) {
	empID := c.Param("empid")
	reqID := c.Param("reqid")

	emp, err := services.GetEmployee(empID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	err = emp.DeleteLeaveRequest(reqID)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func AddEmployeeLaborCode(c *gin.Context) {
	var data web.EmployeeLaborCodeRequest
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.EmployeeResponse{Employee: nil, Exception: "Trouble with request"})
		return
	}

	emp, err := services.GetEmployee(data.EmployeeID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	emp.AddLaborCode(data.ChargeNumber, data.Extension)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}

func DeleteEmployeeLaborCode(c *gin.Context) {
	empID := c.Param("empid")
	chgNo := c.Param("chgno")
	ext := c.Param("ext")

	emp, err := services.GetEmployee(empID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.EmployeeResponse{Employee: nil,
				Exception: "Employee Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
				Exception: err.Error()})
		}
		return
	}

	emp.DeleteLaborCode(chgNo, ext)

	err = services.UpdateEmployee(emp)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.EmployeeResponse{Employee: nil,
			Exception: err.Error()})
		return
	}

	// return the corrected employee back to the client.
	emp.Decrypt()
	c.JSON(http.StatusOK, web.EmployeeResponse{Employee: emp, Exception: ""})
}
