package reports

import (
	"sort"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/sites"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/xuri/excelize/v2"
)

type LeaveMonth struct {
	Month   time.Time
	Periods []LeavePeriod
}

type ByLeaveMonth []LeaveMonth

func (c ByLeaveMonth) Len() int { return len(c) }
func (c ByLeaveMonth) Less(i, j int) bool {
	return c[i].Month.Before(c[j].Month)
}
func (c ByLeaveMonth) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

func (lm *LeaveMonth) GetPTOActual() float64 {
	hours := 0.0
	for _, lvPer := range lm.Periods {
		if strings.EqualFold(lvPer.Code, "V") {
			for _, lv := range lvPer.Leaves {
				if strings.EqualFold(lv.Status, "actual") {
					hours += lv.Hours
				}
			}
		}
	}
	return hours
}

func (lm *LeaveMonth) GetPTOSchedule() float64 {
	hours := 0.0
	for _, lvPer := range lm.Periods {
		if strings.EqualFold(lvPer.Code, "V") {
			for _, lv := range lvPer.Leaves {
				if !strings.EqualFold(lv.Status, "actual") {
					hours += lv.Hours
				}
			}
		}
	}
	return hours
}

type LeavePeriod struct {
	Code      string
	StartDate time.Time
	EndDate   time.Time
	Status    string
	Leaves    []employees.LeaveDay
}

type ByLeavePeriod []LeavePeriod

func (c ByLeavePeriod) Len() int { return len(c) }
func (c ByLeavePeriod) Less(i, j int) bool {
	return c[i].StartDate.Before(c[j].StartDate)
}
func (c ByLeavePeriod) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

type LeaveReport struct {
	Report    *excelize.File
	Year      int
	TeamID    string
	SiteID    string
	CompanyID string
	Company   *sites.Company
	Workcodes map[string]sites.Workcode
	Styles    map[string]int
	Employees []employees.Employee
}

func (lr *LeaveReport) Create() error {
	lr.Styles = make(map[string]int)
	lr.Workcodes = make(map[string]sites.Workcode)
	lr.Report = excelize.NewFile()

	// get employees with assignments for the site that are assigned
	// during the year.
	startDate := time.Date(lr.Year, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(lr.Year, 12, 31, 23, 59, 59, 0, time.UTC)
	emps, err := services.GetEmployeesForTeam(lr.TeamID)
	if err != nil {
		return err
	}

	for _, emp := range emps {
		if emp.AtSite(lr.SiteID, startDate, endDate) {
			if strings.EqualFold(emp.Data.CompanyInfo.Company, lr.CompanyID) {
				lr.Employees = append(lr.Employees, emp)
			}
		}
	}

	sort.Sort(employees.ByEmployees(lr.Employees))

	team, err := services.GetTeam(lr.TeamID)
	if err != nil {
		return err
	}
	for _, com := range team.Companies {
		if strings.EqualFold(com.ID, lr.CompanyID) {
			lr.Company = &com
		}
	}

	lr.CreateStyles()

	lr.CreateLeaveListing()

	return nil
}

func (lr *LeaveReport) CreateStyles() error {
	style, err := lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"00ffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 12, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["ptoname"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"cccccc"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["section"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"cccccc"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 8, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["sectionlbl"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 8, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["hollblactual"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 8, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["hollblsched"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["holdateactual"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["holdatesched"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["holtaken"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 10, Color: "00ffff"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["holprojected"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 10, Color: "00ffff"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["month"] = style

	// remove the provided sheet "Sheet1" from the workbook
	lr.Report.DeleteSheet("Sheet1")

	return nil
}

func (lr *LeaveReport) CreateLeaveListing() error {
	sheetName := "Leave Listing"
	lr.Report.NewSheet(sheetName)
	options := excelize.ViewOptions{}
	options.ShowGridLines = &[]bool{false}[0]
	lr.Report.SetSheetView(sheetName, 0, &options)

	bHolidays := false
	extendedWidth := 3
	if len(lr.Company.Holidays) > 0 {
		bHolidays = true
		extendedWidth += 4
	}

	// set column widths
	if bHolidays {
		lr.Report.SetColWidth(sheetName, GetColumn(0), GetColumn(0), 3.0)
		lr.Report.SetColWidth(sheetName, GetColumn(1), GetColumn(1), 13.0)
		lr.Report.SetColWidth(sheetName, GetColumn(2), GetColumn(2), 30.0)
		lr.Report.SetColWidth(sheetName, GetColumn(3), GetColumn(3), 7.0)
		lr.Report.SetColWidth(sheetName, GetColumn(4), GetColumn(4), 30.0)
		lr.Report.SetColWidth(sheetName, GetColumn(5), GetColumn(8), 7.0)
	} else {
		lr.Report.SetColWidth(sheetName, GetColumn(0), GetColumn(0), 30.0)
		lr.Report.SetColWidth(sheetName, GetColumn(1), GetColumn(4), 7.0)
	}

	row := 0
	for _, emp := range lr.Employees {
		row++
		// name row for the employee
		style := lr.Styles["ptoname"]
		lr.Report.SetCellStyle(sheetName, GetCellID(0, row),
			GetCellID(extendedWidth, row), style)
		lr.Report.MergeCell(sheetName, GetCellID(0, row),
			GetCellID(extendedWidth, row))
		lr.Report.SetCellValue(sheetName, GetCellID(0, row), emp.Name.GetLastFirst())

		col := 0
		row++
		style = lr.Styles["section"]
		if bHolidays {
			lr.Report.SetCellStyle(sheetName, GetCellID(0, row),
				GetCellID(3, row), style)
			lr.Report.MergeCell(sheetName, GetCellID(0, row),
				GetCellID(3, row))
			lr.Report.SetCellValue(sheetName, GetCellID(0, row), "Holidays")
			col = 4
		}
		lr.Report.SetCellStyle(sheetName, GetCellID(col, row),
			GetCellID(col+3, row), style)
		lr.Report.MergeCell(sheetName, GetCellID(col, row),
			GetCellID(col+3, row))
		lr.Report.SetCellValue(sheetName, GetCellID(col, row), "Leaves")

		col = 0
		row++
		style = lr.Styles["sectionlbl"]
		if bHolidays {
			lr.Report.SetCellStyle(sheetName, GetCellID(0, row), GetCellID(3, row),
				style)
			lr.Report.SetCellValue(sheetName, GetCellID(0, row), "")
			lr.Report.SetCellValue(sheetName, GetCellID(1, row), "Reference Date")
			lr.Report.SetCellValue(sheetName, GetCellID(3, row), "Hours")
			lr.Report.SetCellRichText(sheetName, GetCellID(2, row),
				[]excelize.RichTextRun{
					{
						Text: "Date Taken (",
						Font: &excelize.Font{
							Bold:  true,
							Size: 8,
							Color: "000000",
						},
					},
					{
						Text: "Projected",
						Font: &excelize.Font{
							Bold:  true,
							Size: 8,
							Color: "3366ff",
						},
					},
					{
						Text: ")",
						Font: &excelize.Font{
							Bold:  true,
							Size: 8,
							Color: "000000",
						},
					},
				})
			col = 4
		}
		lr.Report.SetCellStyle(sheetName, GetCellID(col, row), GetCellID(col+3, row),
			style)
		lr.Report.SetCellValue(sheetName, GetCellID(col+2, row), "Taken")
		lr.Report.SetCellRichText(sheetName, GetCellID(col+3, row),
			[]excelize.RichTextRun{
				{
					Text: "Request",
					Font: &excelize.Font{
						Bold:  true,
						Size: 8,
						Color: "3366ff",
					},
				},
			})
		lr.Report.MergeCell(sheetName, GetCellID(col, row), GetCellID(col+1, row))
		lr.Report.SetCellRichText(sheetName, GetCellID(col, row),
			[]excelize.RichTextRun{
				{
					Text: "Leave Taken (",
					Font: &excelize.Font{
						Bold:  true,
						Size: 8,
						Color: "000000",
					},
				},
				{
					Text: "Projected",
					Font: &excelize.Font{
						Bold:  true,
						Size: 8,
						Color: "3366ff",
					},
				},
				{
					Text: ")",
					Font: &excelize.Font{
						Bold:  true,
						Size: 8,
						Color: "000000",
					},
				},
			})
		row++
	}

	return nil
}
