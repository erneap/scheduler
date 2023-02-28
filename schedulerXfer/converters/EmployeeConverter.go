package converters

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
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
	Team         sites.Team
	SiteID       string
	Employees    []employees.Employee
	EmployeeWork []employees.EmployeeWorkRecord
}

func (e *EmployeeConverter) GetTeamInfo() {
	teamCol := config.GetCollection(config.DB, "scheduler", "teams")

	filter := bson.M{"name": "DCGS Field Support"}
	teamCol.FindOne(context.TODO(), filter).Decode(&e.Team)

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
	for _, user := range e.Users {
		fmt.Println(user.GetFullName())
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
				altID := ""
				if len(row) > columns["PeoplesoftID"] {
					altID = row[columns["PeoplesoftID"]]
				}
				rank := ""
				if len(row) > columns["LaborCategory"] {
					rank = row[columns["LaborCategory"]]
				}
				cCtr := ""
				if len(row) > columns["CostCenter"] {
					cCtr = row[columns["CostCenter"]]
				}
				division := ""
				if len(row) > columns["SubCompany"] {
					division = row[columns["SubCompany"]]
				}
				emp := employees.Employee{
					TeamID: e.Team.ID,
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
							AlternateID: altID,
							JobTitle:    row[columns["JobTitle"]],
							Rank:        rank,
							CostCenter:  cCtr,
							Division:    division,
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
				emp.Data.Assignments = append(emp.Data.Assignments, asgmt)
				// check employee against the user's list based on last, first names
				found := false
				for _, user := range e.Users {
					if strings.EqualFold(user.LastName, emp.Name.LastName) &&
						strings.EqualFold(user.FirstName, emp.Name.FirstName) {
						found = true
						emp.ID = user.ID
					}
				}
				if !found {
					emp.ID = primitive.NewObjectID()
				}
				e.Employees = append(e.Employees, emp)
			}
		}
	}

	e.ReadEmployeeLaborCodes()
	e.ReadEmployeeSchedules()
	e.ReadAnnualLeaveBalances(baseDate)
	e.ReadEmployeeLeaves(baseDate)
	e.ReadEmployeeVariations(baseDate)
	e.ReadEmployeeWork(baseDate)
}

func (e *EmployeeConverter) ReadEmployeeLaborCodes() {
	log.Println("Reading Employee's Labor Codes")

	path := filepath.Join(e.BaseLocation, "EmployeeLaborCodes.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("EmplooyeeLaborCodes not present")
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

	rows, err := f.GetRows("EmployeeLaborCodes")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colCell := range row {
				columns[colCell] = j
			}
		} else {
			empID := row[columns["EmployeeID"]]
			chargeNumber := row[columns["WorkCode"]]
			extension := row[columns["Extension"]]

			// before a labor code is added to an employee if must first be checked
			// to see if the team record still includes it.
			useWorkcode := false
			for _, site := range e.Team.Sites {
				for _, fcRpt := range site.ForecastReports {
					for _, lc := range fcRpt.LaborCodes {
						if lc.ChargeNumber == chargeNumber && lc.Extension == extension {
							useWorkcode = true
						}
					}
				}
			}
			if useWorkcode {
				for j, emp := range e.Employees {
					if emp.Data.CompanyInfo.EmployeeID == empID {
						emp.Data.LaborCodes = append(emp.Data.LaborCodes,
							employees.EmployeeLaborCode{
								ChargeNumber: chargeNumber,
								Extension:    extension,
							})
						e.Employees[j] = emp
					}
				}
			}
		}
	}

}

func (e *EmployeeConverter) ReadEmployeeSchedules() {
	log.Println("Reading Employee's Schedules")

	path := filepath.Join(e.BaseLocation, "WorkSchedule.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("WorkSchedule not present")
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

	rows, err := f.GetRows("WorkSchedule")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colCell := range row {
				columns[colCell] = j
			}
		} else {
			empID := row[columns["EmployeeID"]]
			sortID := ParseUint(row[columns["SortID"]])
			scheduleString := row[columns["Schedule"]]
			schedule := strings.Split(scheduleString, "|")
			for j, emp := range e.Employees {
				if emp.Data.CompanyInfo.EmployeeID == empID {
					count := 0
					for _, ltr := range schedule {
						if ltr != "" {
							count++
						}
					}
					hours := float64(8)
					if count < 5 {
						hours = float64(10)
					}
					if len(emp.Data.Assignments) > 0 {
						asgmt := emp.Data.Assignments[0]
						for k, ltr := range schedule {
							if k == 0 {
								if ltr != "" {
									asgmt.UpdateWorkday(sortID, uint(6), asgmt.Workcenter, ltr, hours)
								} else {
									asgmt.UpdateWorkday(sortID, uint(6), "", "", 0)
								}
							} else {
								if ltr != "" {
									asgmt.UpdateWorkday(sortID, uint(k-1), asgmt.Workcenter, ltr, hours)
								} else {
									asgmt.UpdateWorkday(sortID, uint(k-1), "", "", 0)
								}
							}
						}
						emp.Data.Assignments[0] = asgmt
						e.Employees[j] = emp
					}
				}
			}
		}
	}
}

func (e *EmployeeConverter) ReadAnnualLeaveBalances(baseDate time.Time) {
	log.Println("Reading Employee's Annual Leaves")

	path := filepath.Join(e.BaseLocation, "AnnualLeave.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("AnnualLeave not present")
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

	rows, err := f.GetRows("AnnualLeave")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colCell := range row {
				columns[colCell] = j
			}
		} else {
			year := ParseInt(row[columns["hYear"]])
			if year > baseDate.Year() {
				empID := row[columns["EmployeeID"]]
				annual := ParseFloat(row[columns["Annual"]])
				carryover := ParseFloat(row[columns["CarryOver"]])
				for k, emp := range e.Employees {
					if emp.Data.CompanyInfo.EmployeeID == empID {
						emp.Data.Balances = append(emp.Data.Balances, employees.AnnualLeave{
							Year:      year,
							Annual:    annual,
							Carryover: carryover,
						})
						sort.Sort(employees.ByBalance(emp.Data.Balances))
						e.Employees[k] = emp
					}
				}
			}
		}
	}
}

func (e *EmployeeConverter) ReadEmployeeLeaves(baseDate time.Time) {
	log.Println("Reading Employee's Leaves")

	path := filepath.Join(e.BaseLocation, "Leaves.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("Leaves not present")
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

	rows, err := f.GetRows("Leaves")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colCell := range row {
				columns[colCell] = j
			}
		} else {
			dateTaken := ParseDate(row[columns["DateTaken"]])
			if dateTaken.After(baseDate) {
				empID := row[columns["EmployeeID"]]
				code := row[columns["LeaveCode"]]
				if code[:1] == "H" || code[:1] == "F" {
					code = "H"
				}
				hours := ParseFloat(row[columns["Hours"]])
				status := strings.ToUpper(row[columns["Status"]])
				lv := employees.LeaveDay{
					LeaveDate: dateTaken,
					Code:      code,
					Hours:     hours,
					Status:    status,
				}
				for k, emp := range e.Employees {
					if emp.Data.CompanyInfo.EmployeeID == empID {
						emp.Data.Leaves = append(emp.Data.Leaves, lv)
						sort.Sort(employees.ByLeaveDay(emp.Data.Leaves))
						e.Employees[k] = emp
					}
				}
			}
		}
	}
}

func (e *EmployeeConverter) ReadEmployeeVariations(baseDate time.Time) {
	log.Println("Reading Employee's Schedule Variations")

	path := filepath.Join(e.BaseLocation, "ScheduleVariations.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("ScheduleVariations not present")
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

	rows, err := f.GetRows("ScheduleVariations")
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
			if endDate.After(baseDate) {
				isMids := strings.EqualFold(row[columns["VariationType"]], "mids")
				code := row[columns["ShowCode"]]
				empID := row[columns["EmployeeID"]]
				startDate := ParseDate(row[columns["StartDate"]])
				daysOff := row[columns["DaysOff"]]
				hours := float64(8)
				if len(daysOff) > 2 {
					hours = float64(10)
				}
				variation := employees.Variation{
					Site:      "dgsc",
					IsMids:    isMids,
					StartDate: startDate,
					EndDate:   endDate,
				}
				variation.Schedule.SetScheduleDays(7)
				for d := 0; d < 7; d++ {
					if (d == 0 && daysOff != "SS" && daysOff != "SM" && daysOff != "FSS" &&
						daysOff != "SSM" && daysOff != "SMT") ||
						(d == 1 && daysOff != "MT" && daysOff != "SM" && daysOff != "MTW" &&
							daysOff != "SSM" && daysOff != "SMT") ||
						(d == 2 && daysOff != "MT" && daysOff != "TW" && daysOff != "SMT" &&
							daysOff != "MTW" && daysOff != "TWT") ||
						(d == 3 && daysOff != "WT" && daysOff != "TW" && daysOff != "MTW" &&
							daysOff != "TWT" && daysOff != "WTF") ||
						(d == 4 && daysOff != "WT" && daysOff != "TF" && daysOff != "TWT" &&
							daysOff != "WTF" && daysOff != "TFS") ||
						(d == 5 && daysOff != "TF" && daysOff != "FS" && daysOff != "WTF" &&
							daysOff != "TFS" && daysOff != "FSS") ||
						(d == 6 && daysOff != "FS" && daysOff != "SS" && daysOff != "TFS" &&
							daysOff != "FSS" && daysOff != "SSM") {
						variation.UpdateWorkday(uint(d), "", code, hours)
					} else {
						variation.UpdateWorkday(uint(d), "", "", float64(0))
					}
				}
				for k, emp := range e.Employees {
					if emp.Data.CompanyInfo.EmployeeID == empID {
						wkctr := emp.Data.Assignments[0].Workcenter
						for d := 0; d < 7; d++ {
							if variation.Schedule.Workdays[d].Code != "" {
								variation.Schedule.Workdays[d].Workcenter = wkctr
							}
						}
						emp.Data.Variations = append(emp.Data.Variations, variation)
						sort.Sort(employees.ByVariation(emp.Data.Variations))
						e.Employees[k] = emp
					}
				}
			}
		}
	}
}

func (e *EmployeeConverter) ReadEmployeeWork(baseDate time.Time) {
	log.Println("Reading Employee's Work")

	path := filepath.Join(e.BaseLocation, "WorkHours.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("WorkHours not present")
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

	rows, err := f.GetRows("WorkHours")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colCell := range row {
				columns[colCell] = j
			}
		} else {
			dateWorked := ParseDate(row[columns["DateWorked"]])
			if dateWorked.After(baseDate) {
				empID := row[columns["EmployeeID"]]
				chargeNumber := row[columns["ChargeNumber"]]
				extension := row[columns["Extension"]]
				hours := ParseFloat(row[columns["Hours"]])
				var employeeID primitive.ObjectID
				for _, emp := range e.Employees {
					if emp.Data.CompanyInfo.EmployeeID == empID {
						employeeID = emp.ID
					}
				}
				work := employees.Work{
					DateWorked:   dateWorked,
					ChargeNumber: chargeNumber,
					Extension:    extension,
					PayCode:      1,
					Hours:        hours,
				}
				found := false
				for k, eWork := range e.EmployeeWork {
					if eWork.EmployeeID == employeeID && eWork.Year == uint(dateWorked.Year()) {
						eWork.Work = append(eWork.Work, work)
						e.EmployeeWork[k] = eWork
						found = true
					}
				}
				if !found {
					eWork := employees.EmployeeWorkRecord{
						ID:         primitive.NewObjectID(),
						EmployeeID: employeeID,
						Year:       uint(dateWorked.Year()),
					}
					eWork.Work = append(eWork.Work, work)
					e.EmployeeWork = append(e.EmployeeWork, eWork)
				}
			}
		}
	}
}

func (e *EmployeeConverter) Write() {
	empCol := config.GetCollection(config.DB, "scheduler", "employees")

	empCol.DeleteMany(context.TODO(), bson.M{})

	for _, emp := range e.Employees {
		empCol.InsertOne(context.TODO(), emp)
	}

	empWorkCol := config.GetCollection(config.DB, "scheduler", "employeework")

	empWorkCol.DeleteMany(context.TODO(), bson.M{})

	for _, eWork := range e.EmployeeWork {
		sort.Sort(employees.ByEmployeeWork(eWork.Work))
		empWorkCol.InsertOne(context.TODO(), eWork)
	}
}
