package main

import (
	"fmt"

	"github.com/erneap/scheduler/schedulerXfer/converters"
	"github.com/erneap/scheduler/schedulerXfer/models/config"
)

func main() {
	fmt.Println("Starting")

	config.ConnectDB()

	baseLoc := "/Users/antonerne/Projects/scheduler/DatabaseExport"

	fmt.Println("Copying Users")
	userConvert := converters.UserConverter{}
	userConvert.ReadUsers()
	userConvert.WriteUsers()

	teamConvert := converters.TeamConverter{
		BaseLocation: baseLoc,
	}
	teamConvert.ReadTeam()
	teamConvert.ReadCompanyHolidayDates()
	teamConvert.ReadForecastReports()
	team := teamConvert.WriteTeam()

	employeeConvert := converters.EmployeeConverter{
		BaseLocation: baseLoc,
		Team:         *team,
		SiteID:       "dgsc",
	}
	employeeConvert.ReadEmployees()
	employeeConvert.Write()
}
