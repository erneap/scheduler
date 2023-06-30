package reports

import (
	"archive/zip"
	"bytes"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/dbdata"
	"github.com/erneap/scheduler/schedulerApi/services"
)

type ReportCofS struct {
	Date          time.Time
	TeamID        string
	Companies     map[string]dbdata.Company
	LeaveCodes    map[string]dbdata.Workcode
	ExerciseCodes []dbdata.EmployeeLaborCode
	SiteID        string
	Site          dbdata.Site
	Writer        *zip.Writer
	Buffer        *bytes.Buffer
	StartDate     time.Time
	EndDate       time.Time
	Remarks       []string
}

// //////////////////////////////////////////////////////////
// The idea for this report creation is to create the CofS
// XML files separately, then zip them up into a single file
// and use that for the https response.
// //////////////////////////////////////////////////////////
func (cr *ReportCofS) Create() error {
	// First get the site based on teamid and siteid
	site, err := services.GetSite(cr.TeamID, cr.SiteID)
	if err != nil {
		return err
	}
	cr.Site = *site

	// next get the list of companies associated with this
	// the team
	cr.Companies = make(map[string]dbdata.Company)
	cr.LeaveCodes = make(map[string]dbdata.Workcode)
	team, err := services.GetTeam(cr.TeamID)
	if err != nil {
		return err
	}
	for _, co := range team.Companies {
		cr.Companies[co.ID] = co
	}
	for _, wc := range team.Workcodes {
		if wc.IsLeave {
			cr.LeaveCodes[wc.Id] = wc
		}
	}

	// get workrecords for employees
	for e, emp := range cr.Site.Employees {
		work, err := services.GetEmployeeWork(emp.ID.Hex(),
			uint(cr.Date.Year()))
		if err == nil {
			emp.Work = append(emp.Work, work.Work...)
			cr.Site.Employees[e] = emp
		}
	}

	// set start date as first day of month and end date as
	// first day of next month
	cr.StartDate = time.Date(cr.Date.Year(), cr.Date.Month(),
		1, 0, 0, 0, 0, time.UTC)
	cr.EndDate = cr.StartDate.AddDate(0, 1, 0)

	// get any exercise codes in period
	for _, frct := range cr.Site.ForecastReports {
		for _, flc := range frct.LaborCodes {
			if flc.Exercise && cr.StartDate.Before(flc.EndDate) &&
				cr.EndDate.After(flc.StartDate) {
				elc := dbdata.EmployeeLaborCode{
					ChargeNumber: flc.ChargeNumber,
					Extension:    flc.Extension,
				}
				cr.ExerciseCodes = append(cr.ExerciseCodes, elc)
			}
		}
	}

	// create zip file in a memory buffer to allow the file
	// to be added to it.
	cr.Buffer = new(bytes.Buffer)
	cr.Writer = zip.NewWriter(cr.Buffer)

	for _, cofs := range site.CofSReports {
		if cofs.StartDate.Equal(cr.Date) ||
			cofs.EndDate.Equal(cr.Date) ||
			(cofs.StartDate.Before(cr.Date) &&
				cofs.EndDate.After(cr.Date)) {
			// create this CofS Report as it is in the date range
			err = cr.CreateCofSXML(&cofs)
			if err != nil {
				return err
			}
		}
	}

	err = cr.Writer.Close()

	return err
}

func (cr *ReportCofS) CreateCofSXML(rpt *dbdata.CofSReport) error {
	// this xml file will have the filename of the report's
	// shortname + date create + .xml
	filename := rpt.ShortName + "-" +
		cr.Date.Format("20060102") + ".xml"
	var sb strings.Builder
	cr.Remarks = cr.Remarks[:0]

	// xml header information added first
	sb.WriteString("<?xml version=\"1.0\" encoding=\"UTF-8\"" +
		" standalone=\"yes\" ?>")
	sb.WriteString("<fields xmlns:xsi=\"http://www.w3.org/2001/" +
		"XMLSchema-instance\">")
	sb.WriteString("<Month-Year>" + cr.Date.Format("Jan-2006") +
		"</Month-Year>")
	sb.WriteString("<Month-Year1>" + cr.Date.Format("Jan-2006") +
		"</Month-Year1>")
	sb.WriteString("<Unit>" + rpt.AssociatedUnit + "</Unit>")
	sb.WriteString("<Unit1>" + rpt.AssociatedUnit + "</Unit1>")

	sort.Sort(dbdata.ByCofSCompany(rpt.Companies))

	for c, co := range rpt.Companies {
		if company, ok := cr.Companies[co.ID]; ok {
			sb.WriteString(fmt.Sprintf("<Company%d>%s</Company%d>",
				c+1, company.Name, c+1))
			count := 0
			for _, emp := range cr.Site.Employees {
				if emp.IsActive(cr.StartDate) ||
					emp.IsActive(cr.EndDate.AddDate(0, 0, -1)) {
					hours := 0.0
					bPrimary := false
					for _, lc := range co.LaborCodes {
						hours += emp.GetWorkedHoursForLabor(
							lc.ChargeNumber, lc.Extension, cr.StartDate,
							cr.EndDate)
						for _, elc := range emp.Data.LaborCodes {
							if elc.ChargeNumber == lc.ChargeNumber &&
								elc.Extension == lc.Extension {
								bPrimary = true
							}
						}
					}

					if hours > 0.0 || bPrimary {
						count++
						empString := cr.CreateEmployeeData(count, c+1, emp,
							co.LaborCodes, company.Name, false)
						sb.WriteString(empString)
					}
				}
			}
		}
		if co.AddExercises && len(cr.ExerciseCodes) > 0 {
			count := 0
			for _, emp := range cr.Site.Employees {
				if emp.IsActive(cr.StartDate) ||
					emp.IsActive(cr.EndDate.AddDate(0, 0, -1)) {
					hours := 0.0
					for _, lc := range cr.ExerciseCodes {
						hours += emp.GetWorkedHoursForLabor(
							lc.ChargeNumber, lc.Extension, cr.StartDate,
							cr.EndDate)
					}

					if hours > 0.0 {
						count++
						empString := cr.CreateEmployeeData(count, c+2, emp,
							cr.ExerciseCodes, "", true)
						sb.WriteString(empString)
					}
				}
			}
		}
	}

	if len(cr.Remarks) > 0 {
		sb.WriteString("<REMARKS>")
		for r, rmk := range cr.Remarks {
			if r > 0 {
				sb.WriteString("\n")
			}
			sb.WriteString(rmk)
		}
		sb.WriteString("</REMARKS>")
	}

	sb.WriteString("</fields>")

	content := []byte(sb.String())
	zipFile, err := cr.Writer.Create(filename)
	if err != nil {
		return err
	}
	_, err = zipFile.Write(content)

	return err
}

func (cr *ReportCofS) CreateEmployeeData(count, coCount int,
	emp dbdata.Employee, labor []dbdata.EmployeeLaborCode,
	company string, bExercise bool) string {
	var esb strings.Builder
	total := 0.0
	label := fmt.Sprintf("NameRow%d", count)
	if coCount > 1 {
		label += fmt.Sprintf("_%d", coCount)
	}
	esb.WriteString(fmt.Sprintf(
		"<%s>%s</%s>", label, emp.Name.GetLastFirst(), label))
	label = fmt.Sprintf("PositionRow%d", count)
	if coCount > 1 {
		label += fmt.Sprintf("_%d", coCount)
	}
	esb.WriteString(fmt.Sprintf(
		"<%s>%s</%s>", label, emp.Data.CompanyInfo.JobTitle,
		label))
	current := time.Date(cr.StartDate.Year(),
		cr.StartDate.Month(), cr.StartDate.Day(), 0, 0, 0, 0,
		time.UTC)
	for current.Before(cr.EndDate) {
		hours := 0.0
		label := fmt.Sprintf("Section%dRow%d_%02d", coCount,
			count, current.Day())
		for _, lc := range labor {
			hours += emp.GetWorkedHoursForLabor(lc.ChargeNumber,
				lc.Extension, current, current.AddDate(0, 0, 1))
		}
		if hours > 0.0 {
			hours = (math.Floor(hours * 10)) / 10.0
			total += hours
			iHours := int(math.Floor(hours * 10))
			cHours := int(math.Floor(hours) * 10)
			if cHours == iHours {
				esb.WriteString(fmt.Sprintf("<%s>%.0f</%s>", label,
					hours, label))
			} else {
				esb.WriteString(fmt.Sprintf("<%s>%.1f</%s>", label,
					hours, label))
			}
			if hours > 12.0 {
				remark := fmt.Sprintf("%s: %s %s received safety briefing for working over 12 hours on %s.",
					company, emp.Name.FirstName, emp.Name.LastName,
					current.Format("02 Jan"))
				cr.Remarks = append(cr.Remarks, remark)
			}
		} else if !bExercise {
			wd := emp.GetWorkdayActual(current, 0.0)
			if wd != nil && wd.Code != "" {
				if wc, ok := cr.LeaveCodes[wd.Code]; ok && wc.AltCode != "" {
					esb.WriteString(fmt.Sprintf("<%s>%s</%s>", label,
						wc.AltCode, label))
				} else {
					esb.WriteString(fmt.Sprintf("<%s/>", label))
				}
			} else {
				esb.WriteString(fmt.Sprintf("<%s/>", label))
			}
		} else {
			esb.WriteString(fmt.Sprintf("<%s/>", label))
		}
		current = current.AddDate(0, 0, 1)
	}
	// add total hours but label for row depends on company count
	// if greater than 1 add company count after count
	label = fmt.Sprintf("TotalHoursRow%d", count)
	if coCount > 1 {
		label += fmt.Sprintf("_%d", coCount)
	}
	total = (math.Floor(total * 10)) / 10
	esb.WriteString(fmt.Sprintf("<%s>%.1f</%s>", label, total,
		label))
	if total > 200.0 {
		remark := fmt.Sprintf("%s: %s %s exceeded 200 hours to support ops tempo.",
			company, emp.Name.FirstName, emp.Name.LastName)
		cr.Remarks = append(cr.Remarks, remark)
	}

	return esb.String()
}
