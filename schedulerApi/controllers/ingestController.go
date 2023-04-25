package controllers

import (
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/converters"
	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/ingest"
	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func getIngestEmployees(c *gin.Context) {
	teamid := c.Param("teamid")
	siteid := c.Param("siteid")
	companyid := c.Param("company")

	var companyEmployees []employees.Employee

	empls, err := services.GetEmployees(teamid, siteid)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.IngestResponse{Exception: err.Error()})
		return
	}

	for _, emp := range empls {
		if emp.Data.CompanyInfo.Company == companyid {
			companyEmployees = append(companyEmployees, emp)
		}
	}

	team, err := services.GetTeam(teamid)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.IngestResponse{Exception: err.Error()})
		return
	}

	ingestType := ""
	for _, co := range team.Companies {
		if co.ID == companyid {
			ingestType = co.IngestType
		}
	}

	c.JSON(http.StatusOK, web.IngestResponse{
		Employees:  companyEmployees,
		IngestType: ingestType,
	})
}

func IngestFiles(c *gin.Context) {
	form, _ := c.MultipartForm()
	teamid := form.Value["team"][0]
	siteid := form.Value["site"][0]
	companyid := form.Value["company"][0]

	team, err := services.GetTeam(teamid)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.Message{Message: "Team not found"})
		return
	}

	ingestType := "manual"
	startDay := 0
	var records []ingest.ExcelRow
	start := time.Now()
	end := time.Now()

	for _, co := range team.Companies {
		if co.ID == companyid {
			ingestType = co.IngestType
			startDay = co.IngestStartDay
		}
	}

	files := form.File["file"]
	switch strings.ToLower(ingestType) {
	case "sap":
		sapIngest := converters.SAPIngest{
			Files: files,
		}
		records, start, end = sapIngest.Process()
	}

	// ensure the start date is the start of the company's workweek as provided
	// in the company record.
	for int(start.Weekday()) != startDay {
		start = start.AddDate(0, 0, -1)
	}

	/////////////////////////////////////////////////////////////////////////////
	// Algorithm for updating the employee records for leave and work
	// 1) Get a list of all employees at the site
	// 2) Sort the records by employee id, date, then hours.
	// 3) Create a list of all employees covered by the records.
	// 4) Step through the list of employees and remove leaves and work for the
	//    period.
	// 5) Step through the record and add leaves/work objects to either the
	//    employee or employee's work record.  Update the employee after adding
	//    a leave or create a new employee work record if the employee doesn't
	//    have one create it, if already present, update it.
	/////////////////////////////////////////////////////////////////////////////

	empls, err := services.GetEmployees(teamid, siteid)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.Message{Message: err.Error()})
		return
	}
	sort.Sort(ingest.ByExcelRow(records))
	// step througn records to get list of employee ids, then step through this
	// list and remove leaves and work associated with these employees
	var employeeIDs []string
	for _, rec := range records {
		found := false
		for _, id := range employeeIDs {
			if rec.CompanyID == id {
				found = true
			}
		}
		if !found {
			employeeIDs = append(employeeIDs, rec.CompanyID)
		}
	}

	for _, id := range employeeIDs {
		for i, emp := range empls {
			if emp.Data.CompanyInfo.Company == companyid &&
				emp.Data.CompanyInfo.EmployeeID == id {
				emp.RemoveLeaves(start, end)
				services.UpdateEmployee(&emp)
				empls[i] = emp

				work, err := services.GetEmployeeWork(emp.ID.Hex(), uint(start.Year()))
				if err == nil {
					work.RemoveWork(start, end)
					services.UpdateEmployeeWork(work)
				}
				if start.Year() != end.Year() {
					work, err := services.GetEmployeeWork(emp.ID.Hex(), uint(end.Year()))
					if err == nil {
						work.RemoveWork(start, end)
						services.UpdateEmployeeWork(work)
					}
				}
			}
		}
	}

	for _, rec := range records {
		// find the employee in the employees list
		for i, emp := range empls {
			if emp.Data.CompanyInfo.Company == companyid &&
				emp.Data.CompanyInfo.EmployeeID == rec.CompanyID {
				if rec.Code != "" {
					// leave, so add to employee and update
					lvid := -1
					for _, lv := range emp.Data.Leaves {
						if lvid < lv.ID {
							lvid = lv.ID
						}
					}
					lv := employees.LeaveDay{
						ID:        lvid + 1,
						LeaveDate: rec.Date,
						Code:      rec.Code,
						Hours:     rec.Hours,
						Status:    "ACTUAL",
						RequestID: "",
					}
					emp.Data.Leaves = append(emp.Data.Leaves, lv)
					empls[i] = emp
					err := services.UpdateEmployee(&emp)
					if err != nil {
						fmt.Println(err)
					}
				} else {
					// work object, so get work record object for employee and year, then
					// add it to the work record, update it in the database.
					wr := employees.Work{
						DateWorked:   rec.Date,
						ChargeNumber: rec.ChargeNumber,
						Extension:    rec.Extension,
						PayCode:      converters.ParseInt(rec.Preminum),
						Hours:        rec.Hours,
					}
					workrec, err := services.GetEmployeeWork(emp.ID.Hex(),
						uint(rec.Date.Year()))
					if err != nil {
						workrec = &employees.EmployeeWorkRecord{
							ID:         primitive.NewObjectID(),
							EmployeeID: emp.ID,
							Year:       uint(rec.Date.Year()),
						}
						workrec.Work = append(workrec.Work, wr)
						services.CreateEmployeeWork(workrec)
					} else {
						workrec.Work = append(workrec.Work, wr)
						services.UpdateEmployeeWork(workrec)
					}
				}
			}
		}
	}
	c.JSON(http.StatusOK, web.Message{Message: "Ingest Complete"})
}
