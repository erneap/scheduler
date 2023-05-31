package controllers

import (
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/dbdata"
	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetTeam(c *gin.Context) {
	teamID := c.Param("teamid")

	team, err := services.GetTeam(teamID)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: "Team not found"})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func GetTeams(c *gin.Context) {
	teams, err := services.GetTeams()
	if err != nil {
		c.JSON(http.StatusBadRequest, web.TeamsResponse{
			Exception: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, web.TeamsResponse{
		Teams: teams,
	})
}

func CreateTeam(c *gin.Context) {
	var data web.CreateTeamRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	teams, err := services.GetTeams()
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: "No Teams Available"})
		return
	}

	for _, tm := range teams {
		if strings.EqualFold(tm.Name, data.Name) {
			c.JSON(http.StatusOK, web.SiteResponse{Team: &tm, Site: nil, Exception: ""})
			return
		}
	}

	team := services.CreateTeam(data.Name, data.UseStdWorkcodes)

	// add team leader from data provided
	emp := dbdata.Employee{
		TeamID: team.ID,
		SiteID: "leads",
		Email:  data.Leader.EmailAddress,
		Name: dbdata.EmployeeName{
			FirstName:  data.Leader.FirstName,
			MiddleName: data.Leader.MiddleName,
			LastName:   data.Leader.LastName,
		},
	}
	emp.AddAssignment("leads", "leads", time.Now().UTC())
	services.CreateEmployee(emp, data.Leader.Password, "scheduler-teamleader",
		team.ID.Hex(), "leads")

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func UpdateTeam(c *gin.Context) {
	var data web.UpdateTeamRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	team, err := services.GetTeam(data.TeamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	team.Name = data.Value

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func DeleteTeam(c *gin.Context) {
	teamID := c.Param("teamid")

	tID, err := primitive.ObjectIDFromHex(teamID)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.TeamsResponse{Teams: nil,
			Exception: err.Error()})
	}

	// get list of employees that are assigned to the team
	employees, err := services.GetEmployeesForTeam(teamID)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.TeamsResponse{Teams: nil,
			Exception: err.Error()})
	}

	for _, emp := range employees {
		services.DeleteEmployee(emp.ID.Hex())
		services.DeleteUser(emp.ID)
	}

	err = services.DeleteTeam(tID)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.TeamsResponse{Teams: nil,
			Exception: err.Error()})
	}

	teams, err := services.GetTeams()
	if err != nil {
		c.JSON(http.StatusBadRequest, web.TeamsResponse{Teams: nil,
			Exception: err.Error()})
	}

	c.JSON(http.StatusOK, web.TeamsResponse{Teams: teams, Exception: ""})
}

func CreateWorkcode(c *gin.Context) {
	var data web.CreateTeamWorkcodeRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	team, err := services.GetTeam(data.TeamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	found := false
	for w, wCode := range team.Workcodes {
		if strings.EqualFold(wCode.Id, data.Id) {
			wCode.Title = data.Title
			wCode.BackColor = data.BackColor
			wCode.TextColor = data.TextColor
			wCode.IsLeave = data.IsLeave
			wCode.ShiftCode = data.ShiftCode
			wCode.AltCode = data.AltCode
			wCode.StartTime = data.StartTime
			found = true
			team.Workcodes[w] = wCode
		}
	}
	if !found {
		wCode := dbdata.Workcode{
			Id:        data.Id,
			Title:     data.Title,
			StartTime: data.StartTime,
			ShiftCode: data.ShiftCode,
			AltCode:   data.AltCode,
			IsLeave:   data.IsLeave,
			BackColor: data.BackColor,
			TextColor: data.TextColor,
		}
		team.Workcodes = append(team.Workcodes, wCode)
		sort.Sort(dbdata.ByWorkcode(team.Workcodes))
	}

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func UpdateTeamWorkcode(c *gin.Context) {
	var data web.UpdateTeamRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	team, err := services.GetTeam(data.TeamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	for w, wCode := range team.Workcodes {
		if strings.EqualFold(wCode.Id, data.AdditionalID) {
			switch strings.ToLower(data.Field) {
			case "title":
				wCode.Title = data.Value
			case "start", "starttime":
				tTime, _ := strconv.ParseUint(data.Value, 10, 64)
				wCode.StartTime = tTime
			case "shift", "shiftcode", "premimum":
				wCode.ShiftCode = data.Value
			case "isleave", "leave":
				wCode.IsLeave = strings.EqualFold(data.Value, "true")
			case "back", "bkg", "backcolor":
				wCode.BackColor = data.Value
			case "fore", "text", "textcolor":
				wCode.TextColor = data.Value
			case "alt", "altcode":
				wCode.AltCode = data.Value
			case "colors":
				colors := strings.Split(data.Value, "-")
				wCode.TextColor = colors[0]
				wCode.BackColor = colors[1]
			}
			team.Workcodes[w] = wCode
			sort.Sort(dbdata.ByWorkcode(team.Workcodes))
		}
	}

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func DeleteTeamWorkcode(c *gin.Context) {
	teamID := c.Param("teamid")
	wcID := c.Param("wcid")

	team, err := services.GetTeam(teamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	pos := -1
	for w, wCode := range team.Workcodes {
		if strings.EqualFold(wCode.Id, wcID) {
			pos = w
		}
	}

	if pos >= 0 {
		team.Workcodes = append(team.Workcodes[:pos], team.Workcodes[pos+1:]...)
	}

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func CreateTeamCompany(c *gin.Context) {
	var data web.CreateTeamCompany

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	team, err := services.GetTeam(data.TeamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	found := false
	for c, company := range team.Companies {
		if strings.EqualFold(company.ID, data.ID) {
			found = true
			company.Name = data.Name
			company.IngestType = data.IngestType
			team.Companies[c] = company
		}
	}
	if !found {
		company := dbdata.Company{
			ID:         data.ID,
			Name:       data.Name,
			IngestType: data.IngestType,
		}
		team.Companies = append(team.Companies, company)
		sort.Sort(dbdata.ByCompany(team.Companies))
	}

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func UpdateTeamCompany(c *gin.Context) {
	var data web.UpdateTeamRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	team, err := services.GetTeam(data.TeamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	fmt.Printf("Field: %s, Value: %s\n", data.Field, data.Value)
	for c, company := range team.Companies {
		if strings.EqualFold(company.ID, data.AdditionalID) {
			switch strings.ToLower(data.Field) {
			case "name":
				company.Name = data.Value
			case "ingest", "ingesttype":
				company.IngestType = data.Value
			case "ingestpwd":
				company.IngestPwd = data.Value
			case "ingestperiod", "period":
				iVal, err := strconv.Atoi(data.Value)
				if err == nil {
					company.IngestPeriod = iVal
				}
			case "ingeststartday", "startday", "start":
				iVal, err := strconv.Atoi(data.Value)
				if err == nil {
					company.IngestStartDay = iVal
				}
			}
			team.Companies[c] = company
		}
	}

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func DeleteTeamCompany(c *gin.Context) {
	teamID := c.Param("teamid")
	companyID := c.Param("companyid")

	team, err := services.GetTeam(teamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	pos := -1
	for c, company := range team.Companies {
		if strings.EqualFold(company.ID, companyID) {
			pos = c
		}
	}

	if pos >= 0 {
		team.Companies = append(team.Companies[:pos], team.Companies[pos+1:]...)
	}

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func CreateCompanyHoliday(c *gin.Context) {
	var data web.CreateCompanyHoliday

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	team, err := services.GetTeam(data.TeamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	found := false
	maxID := -1
	for c, company := range team.Companies {
		if strings.EqualFold(company.ID, data.CompanyID) {
			for h, holiday := range company.Holidays {
				if strings.EqualFold(holiday.Name, data.Name) {
					found = true
					holiday.Name = data.Name
					if data.Actual != "" {
						newDate, _ := time.Parse("2006-01-02", data.Actual)
						dateFound := false
						for _, dt := range holiday.ActualDates {
							if dt.Equal(newDate) {
								dateFound = true
							}
						}
						if !dateFound {
							holiday.ActualDates = append(holiday.ActualDates, newDate)
						}
					}
					company.Holidays[h] = holiday
				}
				if strings.EqualFold(holiday.ID, data.HolidayID) &&
					maxID < int(holiday.SortID) {
					maxID = int(holiday.SortID)
				}
			}
			if !found {
				holiday := dbdata.CompanyHoliday{
					ID:     data.HolidayID,
					Name:   data.Name,
					SortID: uint(maxID + 1),
				}
				if data.Actual != "" {
					newDate, _ := time.Parse("2006-01-02", data.Actual)
					holiday.ActualDates = append(holiday.ActualDates, newDate)
				}
				company.Holidays = append(company.Holidays, holiday)
			}
			sort.Sort(dbdata.ByCompanyHoliday(company.Holidays))
			team.Companies[c] = company
		}
	}

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func UpdateCompanyHoliday(c *gin.Context) {
	var data web.UpdateTeamRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	team, err := services.GetTeam(data.TeamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	holID := data.HolidayID[0:1]
	holSortID, err := strconv.Atoi(data.HolidayID[1:])
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}
	for c, company := range team.Companies {
		if strings.EqualFold(company.ID, data.AdditionalID) {
			sort.Sort(dbdata.ByCompanyHoliday(company.Holidays))
			for h, holiday := range company.Holidays {
				if holiday.ID == holID && holiday.SortID == uint(holSortID) {
					switch strings.ToLower(data.Field) {
					case "name":
						holiday.Name = data.Value
					case "move":
						tSort := holiday.SortID
						if strings.ToLower(data.Value[:1]) == "u" {
							if h > 0 {
								holiday2 := company.Holidays[h-1]
								if holiday2.ID == holID {
									holiday.SortID = holiday2.SortID
									holiday2.SortID = tSort
									company.Holidays[h-1] = holiday2
								}
							}
						} else if strings.ToLower(data.Value[:1]) == "d" {
							if h < len(company.Holidays)-1 {
								holiday2 := company.Holidays[h+1]
								if holiday2.ID == holID {
									holiday.SortID = holiday2.SortID
									holiday2.SortID = tSort
									company.Holidays[h+1] = holiday2
								}
							}
						}
					case "addactual", "addactualdate", "actual":
						tDate, _ := time.Parse("2006-01-02", data.Value)
						found := false
						for d, aDate := range holiday.ActualDates {
							if aDate.Year() == tDate.Year() {
								found = true
								holiday.ActualDates[d] = tDate
							}
						}
						if !found {
							holiday.ActualDates = append(holiday.ActualDates, tDate)
						}
					case "removeactual", "removeactualdate":
						tDate, _ := time.Parse("2006-01-02", data.Value)
						pos := -1
						for d, aDate := range holiday.ActualDates {
							if aDate.Equal(tDate) {
								pos = d
							}
						}
						if pos >= 0 {
							holiday.ActualDates = append(holiday.ActualDates[:pos],
								holiday.ActualDates[pos+1:]...)
						}
					}
					company.Holidays[h] = holiday
				}
			}
			sort.Sort(dbdata.ByCompanyHoliday(company.Holidays))
			team.Companies[c] = company
		}
	}

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}

func DeleteCompanyHoliday(c *gin.Context) {
	teamID := c.Param("teamid")
	companyID := c.Param("companyid")
	holidayID := c.Param("holidayid")

	holID := holidayID[0:1]
	holSortID, err := strconv.Atoi(holidayID[1:])
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	team, err := services.GetTeam(teamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Team Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	pos := -1
	for c, company := range team.Companies {
		if strings.EqualFold(company.ID, companyID) {
			for h, holiday := range company.Holidays {
				if strings.EqualFold(holiday.ID, holID) &&
					holiday.SortID == uint(holSortID) {
					pos = h
				}
			}
			if pos >= 0 {
				company.Holidays = append(company.Holidays[:pos],
					company.Holidays[pos+1:]...)
			}
			sort.Sort(dbdata.ByCompanyHoliday(company.Holidays))
			holID = ""
			sortID := 0
			for h, hol := range company.Holidays {
				if hol.ID != holID {
					holID = hol.ID
					sortID = 0
				}
				sortID++
				hol.SortID = uint(sortID)
				company.Holidays[h] = hol
			}
			team.Companies[c] = company
		}
	}

	if err = services.UpdateTeam(team); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: team, Site: nil, Exception: ""})
}
