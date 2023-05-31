package controllers

import (
	"bytes"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/reports"
	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
)

func CreateReport(c *gin.Context) {
	var data web.ReportRequest
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.Message{Message: "Trouble with request: " + err.Error()})
		return
	}

	now := time.Now().UTC()
	month := now.Month()
	day := now.Day()
	year := now.Year()
	if data.Period != "" {
		parts := strings.Split(data.Period, "|")
		if len(parts) > 0 {
			year, _ = strconv.Atoi(parts[0])
		}
		if len(parts) > 1 {
			tmonth, err := strconv.Atoi(parts[1])
			if err == nil {
				month = time.Month(tmonth)
			}
		}
		if len(parts) > 2 {
			day, _ = strconv.Atoi(parts[2])
		}
	}

	switch strings.ToLower(data.ReportType) {
	case "schedule":
		sr := reports.ScheduleReport{
			Year:   year,
			TeamID: data.TeamID,
			SiteID: data.SiteID,
		}
		if err := sr.Create(); err != nil {
			fmt.Println("Creation: " + err.Error())
			c.JSON(http.StatusInternalServerError, "Creation: "+err.Error())
			return
		}
		var b bytes.Buffer
		if err := sr.Report.Write(&b); err != nil {
			fmt.Println("Buffer Write: " + err.Error())
			c.JSON(http.StatusInternalServerError, "Buffer Write: "+err.Error())
			return
		}

		// get team to include in the download name
		team, _ := services.GetTeam(data.TeamID)
		site, _ := services.GetSite(data.TeamID, data.SiteID)
		downloadName := strings.ReplaceAll(team.Name, " ", "_") + "-" + site.Name +
			"-Schedule.xlsx"
		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Disposition", "attachment; filename="+downloadName)
		c.Data(http.StatusOK,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			b.Bytes())
	case "ptoholiday":
		lr := reports.LeaveReport{
			Year:      year,
			TeamID:    data.TeamID,
			SiteID:    data.SiteID,
			CompanyID: data.CompanyID,
		}
		if err := lr.Create(); err != nil {
			fmt.Println("Creation: " + err.Error())
			c.JSON(http.StatusInternalServerError, "Creation: "+err.Error())
			return
		}
		var b bytes.Buffer
		if err := lr.Report.Write(&b); err != nil {
			fmt.Println("Buffer Write: " + err.Error())
			c.JSON(http.StatusInternalServerError, "Buffer Write: "+err.Error())
			return
		}

		// get team to include in the download name
		team, _ := services.GetTeam(data.TeamID)
		site, _ := services.GetSite(data.TeamID, data.SiteID)
		downloadName := strings.ReplaceAll(team.Name, " ", "_") + "-" + site.Name +
			"-Leaves.xlsx"
		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Disposition", "attachment; filename="+downloadName)
		c.Data(http.StatusOK,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			b.Bytes())
	case "chargenumber":
		reportDate := time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
		laborrpt := reports.LaborReport{
			Date:   reportDate,
			TeamID: data.TeamID,
			SiteID: data.SiteID,
		}
		if err := laborrpt.Create(); err != nil {
			fmt.Println("Creation: " + err.Error())
			c.JSON(http.StatusInternalServerError, "Creation: "+err.Error())
			return
		}
		var b bytes.Buffer
		if err := laborrpt.Report.Write(&b); err != nil {
			fmt.Println("Buffer Write: " + err.Error())
			c.JSON(http.StatusInternalServerError, "Buffer Write: "+err.Error())
			return
		}

		// get team to include in the download name
		team, _ := services.GetTeam(data.TeamID)
		site, _ := services.GetSite(data.TeamID, data.SiteID)
		downloadName := strings.ReplaceAll(team.Name, " ", "_") + "-" + site.Name +
			"-ChargeNumber.xlsx"
		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Disposition", "attachment; filename="+downloadName)
		c.Data(http.StatusOK,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			b.Bytes())
	case "cofs":
		reportDate := time.Date(year, month, 1, 0, 0, 0, 0,
			time.UTC)
		fmt.Println(reportDate)
		cofsReport := reports.ReportCofS{
			Date:   reportDate,
			TeamID: data.TeamID,
			SiteID: data.SiteID,
		}
		if err := cofsReport.Create(); err != nil {
			fmt.Println("Creation: " + err.Error())
			c.JSON(http.StatusInternalServerError, "Creation: "+err.Error())
			return
		}
		downloadName := "CofSReports-" + reportDate.Format("20060102") + ".zip"
		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Disposition", "attachment; filename="+downloadName)
		c.Data(http.StatusOK,
			"application/zip", cofsReport.Buffer.Bytes())
	default:
		c.JSON(http.StatusBadRequest, web.SiteResponse{
			Exception: "No valid report requested",
		})
	}
}
