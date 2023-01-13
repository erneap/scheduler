package main

import (
	"fmt"

	"github.com/erneap/scheduler/schedulerXfer/converters"
	"github.com/erneap/scheduler/schedulerXfer/models/config"
)

func main() {
	fmt.Println("Starting")

	config.ConnectDB()

	fmt.Println("Copying Users")
	userConvert := converters.UserConverter{}
	userConvert.ReadUsers()
	userConvert.WriteUsers()

	teamConvert := converters.TeamConverter{
		BaseLocation: "/Users/antonerne/Projects/scheduler/DatabaseExport",
	}
	teamConvert.ReadTeam()
	teamConvert.ReadCompanyHolidayDates()
	teamConvert.ReadForecastReports()
	teamConvert.WriteTeam()

}
