package main

import (
	"fmt"

	"github.com/erneap/scheduler/schedulerApi/controllers"
	"github.com/erneap/scheduler/schedulerApi/middleware"
	"github.com/erneap/scheduler/schedulerApi/models/config"
	"github.com/gin-gonic/gin"
)

func main() {
	fmt.Println("Starting")

	// run database
	config.ConnectDB()

	// add routes
	router := gin.Default()
	roles := []string{"ADMIN", "SCHEDULER", "LEADER"}
	api := router.Group("/scheduler/api/v1")
	{
		users := api.Group("/user")
		{
			users.POST("/login", controllers.Login)
			users.PUT("/password", middleware.CheckJWT(), controllers.ChangePassword)
			users.PUT("/changes", middleware.CheckJWT(), controllers.ChangeUser)
		}
		emp := api.Group("/employee")
		{
			emp.GET("/:empid", middleware.CheckJWT(), controllers.GetEmployee)
			emp.POST("/", middleware.CheckJWT(), middleware.CheckRoles("scheduler", roles),
				controllers.CreateEmployee)
			emp.PUT("/", middleware.CheckJWT(), controllers.UpdateEmployeeBasic)
			emp.DELETE("/:empid", middleware.CheckJWT(), controllers.DeleteEmployee)
			asgmt := emp.Group("/assignment").Use(middleware.CheckJWT())
			{
				asgmt.POST("/", controllers.CreateEmployeeAssignment)
				asgmt.PUT("/", controllers.UpdateEmployeeAssignment)
				asgmt.PUT("/workday", controllers.UpdateEmployeeAssignmentWorkday)
				asgmt.DELETE("/:empid/:asgmtid",
					controllers.DeleteEmployeeAssignment)
			}
			vari := emp.Group("/variation").Use(middleware.CheckJWT())
			{
				vari.POST("/", controllers.CreateEmployeeVariation)
				vari.PUT("/", controllers.UpdateEmployeeVariation)
				vari.PUT("/workday", controllers.UpdateEmployeeVariationWorkday)
				vari.DELETE("/:empid/:variid", controllers.DeleteEmployeeVariation)
			}
			balance := emp.Group("/balance").Use(middleware.CheckJWT())
			{
				balance.POST("/", controllers.CreateEmployeeLeaveBalance)
				balance.PUT("/", controllers.UpdateEmployeeLeaveBalance)
				balance.DELETE("/:empid/:year", controllers.DeleteEmployeeLeaveBalance)
			}
			leaves := emp.Group("/leaves").Use(middleware.CheckJWT())
			{
				leaves.POST("/", controllers.AddEmployeeLeaveDay)
				leaves.PUT("/", controllers.UpdateEmployeeLeaveDay)
				leaves.DELETE("/:empid/:lvid", controllers.DeleteEmployeeLeaveDay)
			}
			lvReq := emp.Group("/request").Use(middleware.CheckJWT())
			{
				lvReq.POST("/", controllers.CreateEmployeeLeaveRequest)
				lvReq.PUT("/", controllers.UpdateEmployeeLeaveRequest)
				lvReq.DELETE("/:empid/:reqid", controllers.DeleteEmployeeLeaveRequest)
			}
			lCode := emp.Group("/laborcode").Use(middleware.CheckJWT())
			{
				lCode.POST("/", controllers.AddEmployeeLaborCode)
				lCode.DELETE("/:empid/:chgno/:ext", controllers.DeleteEmployeeLaborCode)
			}
		}
		site := api.Group("/site", middleware.CheckJWT(),
			middleware.CheckRoles("scheduler", roles))
		{
			site.GET("/:teamid/:siteid", controllers.GetSite)
			site.GET("/:teamid/:siteid/:employees", controllers.GetSite)
			site.POST("/", controllers.CreateSite)
			site.PUT("/", controllers.UpdateSite)
			site.DELETE("/:teamid/:siteid", controllers.DeleteSite)
			site.POST("/balances", controllers.AddSitesEmployeeLeaveBalances)

			wkctr := site.Group("/workcenter")
			{
				wkctr.POST("/", controllers.CreateWorkcenter)
				wkctr.PUT("/", controllers.UpdateWorkcenter)
				wkctr.DELETE("/:teamid/:siteid/:wkctrid",
					controllers.DeleteSiteWorkcenter)

				position := wkctr.Group("/position")
				{
					position.POST("/", controllers.CreateWorkcenterPosition)
					position.PUT("/", controllers.UpdateWorkcenterPosition)
					position.DELETE("/:teamid/:siteid/:wkctrid/:posid",
						controllers.DeleteWorkcenterPosition)
				}

				shifts := wkctr.Group("/shift")
				{
					shifts.POST("/", controllers.CreateWorkcenterShift)
					shifts.PUT("/", controllers.UpdateWorkcenterShift)
					shifts.DELETE("/:teamid/:siteid/:wkctrid/:shiftid",
						controllers.DeleteWorkcenterShift)
				}
			}
			lCode := site.Group("/laborcode")
			{
				lCode.POST("/", controllers.CreateSiteLaborCode)
				lCode.PUT("/", controllers.UpdateSiteLaborCode)
				lCode.DELETE("/:teamid/:siteid/:chgno/:ext",
					controllers.DeleteSiteLaborCode)
			}
			rpt := site.Group("/forecast")
			{
				rpt.POST("/", controllers.CreateSiteForecastReport)
				rpt.PUT("/", controllers.UpdateSiteForecastReport)
				rpt.DELETE("/:teamid/:siteid/:rptid",
					controllers.DeleteSiteForecastReport)
			}
		}

		team := api.Group("/team", middleware.CheckJWT())
		{
			team.GET("/:teamid", controllers.GetTeam)
			team.POST("/", middleware.CheckRoles("scheduler", roles),
				controllers.CreateTeam)
			team.PUT("/", middleware.CheckRoles("scheduler", roles),
				controllers.UpdateTeam)
			team.DELETE("/:teamid", middleware.CheckRoles("scheduler", roles),
				controllers.DeleteTeam)
			wcode := team.Group("/workcode", middleware.CheckRoles("schedulers", roles))
			{
				wcode.POST("/", controllers.CreateWorkcode)
				wcode.PUT("/", controllers.UpdateTeamWorkcode)
				wcode.DELETE("/:teamid/:wcid", controllers.DeleteTeamWorkcode)
			}
			comp := team.Group("/company", middleware.CheckRoles("scheduler", roles))
			{
				comp.POST("/", controllers.CreateTeamCompany)
				comp.PUT("/", controllers.UpdateTeamCompany)
				comp.DELETE("/:teamid/:companyid", controllers.DeleteTeamCompany)

				holiday := comp.Group("/holiday")
				{
					holiday.POST("/", controllers.CreateCompanyHoliday)
					holiday.PUT("/", controllers.UpdateCompanyHoliday)
					holiday.DELETE("/:teamid/:companyid/:holidayid",
						controllers.DeleteCompanyHoliday)
				}
			}
		}
	}

	// listen on port 3000
	router.Run(":4000")
}
