package controllers

import (
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/sites"
	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetSite(c *gin.Context) {
	teamID := c.Param("teamid")
	siteID := c.Param("siteid")
	allEmployees := ShowEmployees(c)

	site, err := services.GetSite(teamID, siteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	if allEmployees {
		emps, _ := services.GetEmployees(teamID, siteID)
		site.Employees = append(site.Employees, emps...)
		sort.Sort(employees.ByEmployees(site.Employees))
	}
	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func ShowEmployees(c *gin.Context) bool {
	return strings.ToLower(c.Param("employees")) == "true"
}

func CreateSite(c *gin.Context) {
	var data web.NewSiteRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.CreateSite(data.TeamID, data.SiteID, data.Name)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func UpdateSite(c *gin.Context) {
	var data web.NewSiteRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	site.Name = data.Name
	err = services.UpdateSite(data.TeamID, *site)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func DeleteSite(c *gin.Context) {
	teamid := c.Param("teamid")
	siteid := c.Param("siteid")

	err := services.DeleteSite(teamid, siteid)

	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}
	c.Status(http.StatusOK)
}

// workcenter controls
func CreateWorkcenter(c *gin.Context) {
	var data web.NewSiteWorkcenter

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}
	found := false
	sort := -1
	for i, wkctr := range site.Workcenters {
		if strings.EqualFold(wkctr.ID, data.WkctrID) {
			found = true
			wkctr.Name = data.Name
			site.Workcenters[i] = wkctr
		}
		if sort < int(wkctr.SortID) {
			sort = int(wkctr.SortID)
		}
	}
	if !found {
		wkctr := sites.Workcenter{
			ID:     data.WkctrID,
			Name:   data.Name,
			SortID: uint(sort + 1),
		}
		site.Workcenters = append(site.Workcenters, wkctr)
	}
	err = services.UpdateSite(data.TeamID, *site)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}
	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func UpdateWorkcenter(c *gin.Context) {
	var data web.SiteWorkcenterUpdate

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	sort.Sort(sites.ByWorkcenter(site.Workcenters))

	for i, wkctr := range site.Workcenters {
		if strings.EqualFold(wkctr.ID, data.WkctrID) {
			switch strings.ToLower(data.Field) {
			case "id":
				wkctr.ID = data.Value
			case "name":
				wkctr.Name = data.Value
			case "move":
				if strings.EqualFold(data.Value, "up") {
					if i > 0 {
						tSort := site.Workcenters[i-1].SortID
						site.Workcenters[i-1].SortID = wkctr.SortID
						wkctr.SortID = tSort
					}
				} else if strings.EqualFold(data.Value, "down") {
					if i < len(site.Workcenters)-1 {
						tSort := site.Workcenters[i+1].SortID
						site.Workcenters[i+1].SortID = wkctr.SortID
						wkctr.SortID = tSort
					}
				}
			}
			site.Workcenters[i] = wkctr
		}
	}
	err = services.UpdateSite(data.TeamID, *site)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}
	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func DeleteSiteWorkcenter(c *gin.Context) {
	teamID := c.Param("teamid")
	siteID := c.Param("siteid")
	wkctrID := c.Param("wkctrid")

	site, err := services.GetSite(teamID, siteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	pos := -1
	for i, wkctr := range site.Workcenters {
		if strings.EqualFold(wkctr.ID, wkctrID) {
			pos = i
		}
	}
	if pos >= 0 {
		site.Workcenters = append(site.Workcenters[:pos], site.Workcenters[pos+1:]...)
	}
	sort.Sort(sites.ByWorkcenter(site.Workcenters))

	for i, wkctr := range site.Workcenters {
		wkctr.SortID = uint(i)
		site.Workcenters[i] = wkctr
	}
	err = services.UpdateSite(teamID, *site)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}
	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func CreateWorkcenterPosition(c *gin.Context) {
	var data web.NewWorkcenterPosition

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	for i, wkctr := range site.Workcenters {
		if strings.EqualFold(wkctr.ID, data.WkctrID) {
			found := false
			sort := -1
			for p, position := range wkctr.Positions {
				if strings.EqualFold(position.ID, data.PositionID) {
					found = true
					position.Name = data.Name
					wkctr.Positions[p] = position
					site.Workcenters[i] = wkctr
				}
				if !found && sort < int(position.SortID) {
					sort = int(position.SortID)
				}
			}
			if !found {
				position := sites.Position{
					ID:     data.PositionID,
					Name:   data.Name,
					SortID: uint(sort + 1),
				}
				wkctr.Positions = append(wkctr.Positions, position)
				site.Workcenters[i] = wkctr
			}
		}
	}

	if err = services.UpdateSite(data.TeamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func UpdateWorkcenterPosition(c *gin.Context) {
	var data web.WorkcenterPositionUpdate

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	for w, wkctr := range site.Workcenters {
		if strings.EqualFold(wkctr.ID, data.WkctrID) {
			for p, position := range wkctr.Positions {
				if strings.EqualFold(position.ID, data.PositionID) {
					switch strings.ToLower(data.Field) {
					case "name":
						position.Name = data.Value
					case "move":
						if strings.EqualFold(data.Value, "up") {
							if p > 0 {
								tSort := wkctr.Positions[p-1].SortID
								wkctr.Positions[p-1].SortID = position.SortID
								position.SortID = tSort
							}
						} else if strings.EqualFold(data.Value, "down") {
							if p < len(wkctr.Positions)-1 {
								tSort := wkctr.Positions[p+1].SortID
								wkctr.Positions[p+1].SortID = position.SortID
								position.SortID = tSort
							}
						}
					case "addassigned":
						found := false
						for _, asgn := range position.Assigned {
							if strings.EqualFold(asgn, data.Value) {
								found = true
							}
						}
						if !found {
							position.Assigned = append(position.Assigned, data.Value)
						}
					case "removeassigned":
						pos := -1
						for a, asgn := range position.Assigned {
							if strings.EqualFold(asgn, data.Value) {
								pos = a
							}
						}
						if pos >= 0 {
							position.Assigned = append(position.Assigned[:pos],
								position.Assigned[pos+1:]...)
						}
					}
					wkctr.Positions[p] = position
					site.Workcenters[w] = wkctr
				}
			}
		}
	}

	if err = services.UpdateSite(data.TeamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func DeleteWorkcenterPosition(c *gin.Context) {
	teamID := c.Param("teamid")
	siteID := c.Param("siteid")
	wkctrID := c.Param("wkctrid")
	positionID := c.Param("posid")

	site, err := services.GetSite(teamID, siteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	for w, wkctr := range site.Workcenters {
		if strings.EqualFold(wkctr.ID, wkctrID) {
			pos := -1
			for p, position := range wkctr.Positions {
				if strings.EqualFold(position.ID, positionID) {
					pos = p
				}
			}
			if pos >= 0 {
				wkctr.Positions = append(wkctr.Positions[:pos], wkctr.Positions[pos+1:]...)
			}
			site.Workcenters[w] = wkctr
		}
	}

	if err = services.UpdateSite(teamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func CreateWorkcenterShift(c *gin.Context) {
	var data web.NewWorkcenterPosition

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	for i, wkctr := range site.Workcenters {
		if strings.EqualFold(wkctr.ID, data.WkctrID) {
			found := false
			sort := -1
			for s, shift := range wkctr.Shifts {
				if strings.EqualFold(shift.ID, data.PositionID) {
					found = true
					shift.Name = data.Name
					wkctr.Shifts[s] = shift
					site.Workcenters[i] = wkctr
				}
				if !found && sort < int(shift.SortID) {
					sort = int(shift.SortID)
				}
			}
			if !found {
				position := sites.Shift{
					ID:     data.PositionID,
					Name:   data.Name,
					SortID: uint(sort + 1),
				}
				wkctr.Shifts = append(wkctr.Shifts, position)
				site.Workcenters[i] = wkctr
			}
		}
	}

	if err = services.UpdateSite(data.TeamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func UpdateWorkcenterShift(c *gin.Context) {
	var data web.WorkcenterPositionUpdate

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	for w, wkctr := range site.Workcenters {
		if strings.EqualFold(wkctr.ID, data.WkctrID) {
			for s, shift := range wkctr.Shifts {
				if strings.EqualFold(shift.ID, data.PositionID) {
					switch strings.ToLower(data.Field) {
					case "name":
						shift.Name = data.Value
					case "paycode":
						code, _ := strconv.ParseUint(data.Value, 10, 32)
						shift.PayCode = uint(code)
					case "move":
						if strings.EqualFold(data.Value, "up") {
							if s > 0 {
								tSort := wkctr.Shifts[s-1].SortID
								wkctr.Shifts[s-1].SortID = shift.SortID
								shift.SortID = tSort
							}
						} else if strings.EqualFold(data.Value, "down") {
							if s < len(wkctr.Shifts)-1 {
								tSort := wkctr.Shifts[s+1].SortID
								wkctr.Shifts[s+1].SortID = shift.SortID
								shift.SortID = tSort
							}
						}
					case "addcode":
						found := false
						for _, asgn := range shift.AssociatedCodes {
							if strings.EqualFold(asgn, data.Value) {
								found = true
							}
						}
						if !found {
							shift.AssociatedCodes = append(shift.AssociatedCodes, data.Value)
						}
					case "removecode":
						pos := -1
						for a, asgn := range shift.AssociatedCodes {
							if strings.EqualFold(asgn, data.Value) {
								pos = a
							}
						}
						if pos >= 0 {
							shift.AssociatedCodes = append(shift.AssociatedCodes[:pos],
								shift.AssociatedCodes[pos+1:]...)
						}
					}
					wkctr.Shifts[s] = shift
					site.Workcenters[w] = wkctr
				}
			}
		}
	}

	if err = services.UpdateSite(data.TeamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func DeleteWorkcenterShift(c *gin.Context) {
	teamID := c.Param("teamid")
	siteID := c.Param("siteid")
	wkctrID := c.Param("wkctrid")
	shiftID := c.Param("shiftid")

	site, err := services.GetSite(teamID, siteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	for w, wkctr := range site.Workcenters {
		if strings.EqualFold(wkctr.ID, wkctrID) {
			pos := -1
			for s, shift := range wkctr.Shifts {
				if strings.EqualFold(shift.ID, shiftID) {
					pos = s
				}
			}
			if pos >= 0 {
				wkctr.Shifts = append(wkctr.Shifts[:pos], wkctr.Shifts[pos+1:]...)
			}
			site.Workcenters[w] = wkctr
		}
	}

	if err = services.UpdateSite(teamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func CreateSiteLaborCode(c *gin.Context) {
	var data web.NewSiteLaborCode

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	found := false
	for l, lCode := range site.LaborCodes {
		if strings.EqualFold(lCode.ChargeNumber, data.ChargeNumber) &&
			strings.EqualFold(lCode.Extension, data.Extension) {
			found = true
			if data.CLIN != "" {
				lCode.CLIN = data.CLIN
			}
			if data.SLIN != "" {
				lCode.SLIN = data.SLIN
			}
			if data.Location != "" {
				lCode.Location = data.Location
			}
			if data.WBS != "" {
				lCode.WBS = data.WBS
			}
			if data.MinimumEmployees != "" {
				min, _ := strconv.Atoi(data.MinimumEmployees)
				lCode.MinimumEmployees = min
			}
			if data.NotAssignedName != "" {
				lCode.NotAssignedName = data.NotAssignedName
			}
			if data.HoursPerEmployee != "" {
				hours, _ := strconv.ParseFloat(data.HoursPerEmployee, 64)
				lCode.HoursPerEmployee = hours
			}
			if data.Exercise != "" {
				lCode.Exercise = strings.EqualFold(data.Exercise, "true")
			}
			if data.StartDate != "" {
				sDate, _ := time.Parse("2006-01-02", data.StartDate)
				lCode.StartDate = sDate
			}
			if data.EndDate != "" {
				eDate, _ := time.Parse("2006-01-02", data.EndDate)
				lCode.EndDate = eDate
			}
			site.LaborCodes[l] = lCode
		}
	}
	if !found {
		lCode := sites.LaborCode{
			ChargeNumber: data.ChargeNumber,
			Extension:    data.Extension,
		}
		if data.CLIN != "" {
			lCode.CLIN = data.CLIN
		}
		if data.SLIN != "" {
			lCode.SLIN = data.SLIN
		}
		if data.Location != "" {
			lCode.Location = data.Location
		}
		if data.WBS != "" {
			lCode.WBS = data.WBS
		}
		if data.MinimumEmployees != "" {
			min, _ := strconv.Atoi(data.MinimumEmployees)
			lCode.MinimumEmployees = min
		}
		if data.NotAssignedName != "" {
			lCode.NotAssignedName = data.NotAssignedName
		}
		if data.HoursPerEmployee != "" {
			hours, _ := strconv.ParseFloat(data.HoursPerEmployee, 64)
			lCode.HoursPerEmployee = hours
		}
		if data.Exercise != "" {
			lCode.Exercise = strings.EqualFold(data.Exercise, "true")
		}
		if data.StartDate != "" {
			sDate, _ := time.Parse("2006-01-02", data.StartDate)
			lCode.StartDate = sDate
		}
		if data.EndDate != "" {
			eDate, _ := time.Parse("2006-01-02", data.EndDate)
			lCode.EndDate = eDate
		}
		site.LaborCodes = append(site.LaborCodes, lCode)
	}

	if err = services.UpdateSite(data.TeamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func UpdateSiteLaborCode(c *gin.Context) {
	var data web.UpdateSiteLaborCode

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	for l, lCode := range site.LaborCodes {
		if strings.EqualFold(lCode.ChargeNumber, data.ChargeNumber) &&
			strings.EqualFold(lCode.Extension, data.Extension) {
			switch strings.ToLower(data.Field) {
			case "clin":
				lCode.CLIN = data.Value
			case "slin":
				lCode.SLIN = data.Value
			case "location":
				lCode.Location = data.Value
			case "wbs":
				lCode.WBS = data.Value
			case "minimum", "min", "minimumemployees":
				min, _ := strconv.Atoi(data.Value)
				lCode.MinimumEmployees = min
			case "notassigned", "notassignedname":
				lCode.NotAssignedName = data.Value
			case "hours", "hoursperemployee":
				hours, _ := strconv.ParseFloat(data.Value, 64)
				lCode.HoursPerEmployee = hours
			case "exercise":
				lCode.Exercise = strings.EqualFold(data.Value, "true")
			case "start", "startdate":
				tdate, _ := time.Parse("2006-01-02", data.Value)
				lCode.StartDate = tdate
			case "end", "enddate":
				tdate, _ := time.Parse("2006-01-02", data.Value)
				lCode.EndDate = tdate
			}
			site.LaborCodes[l] = lCode
		}
	}

	if err = services.UpdateSite(data.TeamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func DeleteSiteLaborCode(c *gin.Context) {
	teamID := c.Param("teamid")
	siteID := c.Param("siteid")
	chgNo := c.Param("chgno")
	ext := c.Param("ext")

	site, err := services.GetSite(teamID, siteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	pos := -1
	for l, lCode := range site.LaborCodes {
		if strings.EqualFold(lCode.ChargeNumber, chgNo) &&
			strings.EqualFold(lCode.Extension, ext) {
			pos = l
		}
	}
	if pos >= 0 {
		site.LaborCodes = append(site.LaborCodes[:pos], site.LaborCodes[pos+1:]...)
	}

	if err = services.UpdateSite(teamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func CreateSiteForecastReport(c *gin.Context) {
	var data web.CreateSiteForecast

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	fID := -1
	found := false
	for _, rpt := range site.ForecastReports {
		if strings.EqualFold(rpt.Name, data.Name) &&
			rpt.StartDate.Equal(data.StartDate) && rpt.EndDate.Equal(data.EndDate) {
			found = true
		}
		if fID < rpt.ID {
			fID = rpt.ID
		}
	}
	if !found {
		rpt := sites.ForecastReport{
			ID:        fID + 1,
			Name:      data.Name,
			StartDate: data.StartDate,
			EndDate:   data.EndDate,
		}
		start := time.Date(data.StartDate.Year(), data.StartDate.Month(), 1, 0, 0,
			0, 0, time.UTC)
		for start.Before(data.EndDate) {
			end := start.AddDate(0, 1, 0)
			period := sites.ForecastPeriod{
				Month: start,
			}
			for start.Weekday() != time.Friday {
				start = start.AddDate(0, 0, 1)
			}
			for start.Before(end) {
				period.Periods = append(period.Periods, start)
				start = start.AddDate(0, 0, 7)
			}
			rpt.Periods = append(rpt.Periods, period)
			start = end
		}
		site.ForecastReports = append(site.ForecastReports, rpt)
	}

	if err = services.UpdateSite(data.TeamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func UpdateSiteForecastReport(c *gin.Context) {
	var data web.UpdateSiteForecast

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.SiteResponse{Team: nil, Site: nil, Exception: "Trouble with request"})
		return
	}

	site, err := services.GetSite(data.TeamID, data.SiteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	for r, rpt := range site.ForecastReports {
		if rpt.ID == data.ReportID {
			switch strings.ToLower(data.Field) {
			case "name":
				rpt.Name = data.Value
			case "start", "startdate":
				tDate, _ := time.Parse("2006-01-02", data.Value)
				rpt.StartDate = tDate
			case "end", "enddate":
				tDate, _ := time.Parse("2006-01-02", data.Value)
				rpt.EndDate = tDate
			case "addlabor", "addlaborcode":
				parts := strings.Split(data.Value, "|")
				found := false
				for _, lc := range rpt.LaborCodes {
					if strings.EqualFold(lc.ChargeNumber, parts[0]) &&
						strings.EqualFold(lc.Extension, parts[1]) {
						found = true
					}
				}
				if !found {
					lc := sites.LaborCode{
						ChargeNumber: parts[0],
						Extension:    parts[1],
					}
					rpt.LaborCodes = append(rpt.LaborCodes, lc)
				}
			case "deletelabor", "deletelaborcode":
				parts := strings.Split(data.Value, "|")
				found := -1
				for l, lc := range rpt.LaborCodes {
					if strings.EqualFold(lc.ChargeNumber, parts[0]) &&
						strings.EqualFold(lc.Extension, parts[1]) {
						found = l
					}
				}
				if found >= 0 {
					rpt.LaborCodes = append(rpt.LaborCodes[:found],
						rpt.LaborCodes[found+1:]...)
				}
			}
			site.ForecastReports[r] = rpt
		}
	}

	if err = services.UpdateSite(data.TeamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}

func DeleteSiteForecastReport(c *gin.Context) {
	teamID := c.Param("teamid")
	siteID := c.Param("siteid")
	rptID, err := strconv.Atoi(c.Param("rptid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
	}

	site, err := services.GetSite(teamID, siteID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, web.SiteResponse{Team: nil, Site: nil,
				Exception: "Site Not Found"})
		} else {
			c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
				Exception: err.Error()})
		}
		return
	}

	found := -1
	for i, rpt := range site.ForecastReports {
		if rpt.ID == rptID {
			found = i
		}
	}
	if found < 0 {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: "Report Not Found"})
	}

	site.ForecastReports = append(site.ForecastReports[:found],
		site.ForecastReports[found+1:]...)
	if err = services.UpdateSite(teamID, *site); err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: err.Error()})
		return
	}

	c.JSON(http.StatusOK, web.SiteResponse{Team: nil, Site: site, Exception: ""})
}
