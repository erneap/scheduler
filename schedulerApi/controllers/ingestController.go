package controllers

import (
	"net/http"
	"strings"

	"github.com/erneap/scheduler/schedulerApi/converters"
	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
)

func ingestFiles(c *gin.Context) {
	form, _ := c.MultipartForm()
	teamid := form.Value["team"][0]
	companyid := form.Value["company"][0]

	team, err := services.GetTeam(teamid)
	if err != nil {
		c.JSON(http.StatusBadRequest, web.SiteResponse{Team: nil, Site: nil,
			Exception: "Team not found"})
		return
	}

	ingestType := "manual"
	startDay := 0
	period := 7
	for _, co := range team.Companies {
		if co.ID == companyid {
			ingestType = co.IngestType
			startDay = co.IngestStartDay
			period = co.IngestPeriod
		}
	}

	files := form.File["ingest"]
	switch strings.ToLower(ingestType) {
	case "sap":
		sapIngest := converters.SAPIngest{
			Start:  startDay,
			Period: period,
			Files:  files,
		}
		sapIngest.Process()
	}
}
