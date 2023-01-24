package controllers

import (
	"net/http"
	"sort"
	"strings"

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
