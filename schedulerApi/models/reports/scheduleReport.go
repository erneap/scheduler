package reports

import (
	"sort"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/sites"

	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/xuri/excelize/v2"
)

type ScheduleReport struct {
	Report      *excelize.File
	Year        int
	TeamID      string
	SiteID      string
	Workcenters []sites.Workcenter
	Workcodes   map[string]bool
	Styles      map[string]int
	Employees   []*employees.Employee
}

func (sr *ScheduleReport) Create() (*excelize.File, error) {
	sr.Report = excelize.NewFile()
	sr.Year = time.Now().Year()

	// get employees with assignments for the site that are assigned
	// during the year.
	startDate := time.Date(sr.Year, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(sr.Year, 12, 31, 23, 59, 59, 0, time.UTC)
	emps, err := services.GetEmployeesForTeam(sr.TeamID)
	if err != nil {
		return nil, err
	}

	for _, emp := range emps {
		if emp.AtSite(sr.SiteID, startDate, endDate) {
			sr.Employees = append(sr.Employees, &emp)
		}
	}

	// get the site's workcenters
	site, err := services.GetSite(sr.TeamID, sr.SiteID)
	if err != nil {
		return nil, err
	}
	for _, wc := range site.Workcenters {
		sr.Workcenters = append(sr.Workcenters, wc)
	}
	sort.Sort(sites.ByWorkcenter(sr.Workcenters))

	// create styles for display on each monthly sheet
	err = sr.CreateStyles()
	if err != nil {
		return nil, err
	}

	// create monthly schedule for each month of the year
	for i := 0; i < 12; i++ {

	}

	return sr.Report, nil
}

func (sr *ScheduleReport) CreateStyles() error {
	//get all the workcodes from the team object and create the
	// styles for each one, plus one for weekend (non-leave), and
	// even and odd non-leaves.  Also need style for month label and workcenter

	team, err := services.GetTeam(sr.TeamID)
	if err != nil {
		return err
	}

	for _, wc := range team.Workcodes {
		style, err := sr.Report.NewStyle(&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
			},
			Fill: excelize.Fill{Type: "pattern", Color: []string{wc.BackColor}, Pattern: 1},
			Font: &excelize.Font{Bold: true, Size: 11, Color: wc.TextColor},
			Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
				WrapText: true},
		})
		if err != nil {
			return err
		}
		sr.Styles[wc.Id] = style
		sr.Workcodes[wc.Id] = wc.IsLeave
	}

	style, err := sr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"C0C0C0"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 11, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	sr.Styles["evenday"] = style

	style, err = sr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"CCFFFF"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 11, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	sr.Styles["weekend"] = style

	style, err = sr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"FFFFFF"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 11, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	sr.Styles["weekday"] = style

	style, err = sr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"DE5D12"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 11, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	sr.Styles["month"] = style
	return nil
}

func (sr *ScheduleReport) AddMonth(monthID int) error {
	for w, wc := range sr.Workcenters {
		for s, sft := range wc.Shifts {
			sft.Employees = sft.Employees[:0]
			wc.Shifts[s] = sft
		}
		for p, pos := range wc.Positions {
			pos.Employees = pos.Employees[:0]
			wc.Positions[p] = pos
		}
		sr.Workcenters[w] = wc
	}
	startDate := time.Date(sr.Year, time.Month(monthID), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0)
	for _, emp := range sr.Employees {
		if emp.AtSite(sr.SiteID, startDate, endDate) {
			// determine if employee assigned to position
			position := false
			for w, wc := range sr.Workcenters {
				for p, pos := range wc.Positions {
					for _, asgn := range pos.Assigned {
						if emp.ID.Hex() == asgn {
							position = true
							pos.Employees = append(pos.Employees, emp)
						}
					}
					if position {
						wc.Positions[p] = pos
						sr.Workcenters[w] = wc
					}
				}
			}
			if !position {
				wkctr, shift := emp.GetAssignment(startDate, endDate)
				for w, wc := range sr.Workcenters {
					if wc.ID == wkctr {
						for s, sft := range wc.Shifts {
							if sft.ID == shift {
								sft.Employees = append(sft.Employees, emp)
								wc.Shifts[s] = sft
								sr.Workcenters[w] = wc
							}
						}
					}
				}
			}
		}
	}

	// create sheet for the month
	sheetLabel := startDate.Format("Jan06")
	sr.Report.NewSheet(sheetLabel)
	options := excelize.ViewOptions{}
	options.ShowGridLines = &[]bool{false}[0]
	sr.Report.SetSheetView(sheetLabel, 0, &options)

	// set all the column widths

	return nil
}
