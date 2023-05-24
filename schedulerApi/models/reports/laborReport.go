package reports

import (
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/dbdata"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/xuri/excelize/v2"
)

type LaborReport struct {
	Report            *excelize.File
	Date              time.Time
	TeamID            string
	SiteID            string
	ForecastReports   []dbdata.ForecastReport
	Workcodes         map[string]dbdata.Workcode
	Styles            map[string]int
	ConditionalStyles map[string]int
	Employees         []dbdata.Employee
}

func (lr *LaborReport) Create() error {
	lr.Styles = make(map[string]int)
	lr.ConditionalStyles = make(map[string]int)
	lr.Workcodes = make(map[string]dbdata.Workcode)
	lr.Report = excelize.NewFile()

	// Get list of forecast reports for the team/site
	minDate := time.Date(lr.Date.Year(), lr.Date.Month(),
		lr.Date.Day(), 0, 0, 0, 0, time.UTC)
	maxDate := time.Date(lr.Date.Year(), lr.Date.Month(),
		lr.Date.Day(), 0, 0, 0, 0, time.UTC)
	site, err := services.GetSite(lr.TeamID, lr.SiteID)
	if err != nil {
		return err
	}
	for _, fr := range site.ForecastReports {
		if lr.Date.Equal(fr.StartDate) ||
			lr.Date.Equal(fr.EndDate) ||
			(lr.Date.After(fr.StartDate) &&
				lr.Date.Before(fr.EndDate)) {
			lr.ForecastReports = append(lr.ForecastReports, fr)
			if fr.StartDate.Before(minDate) {
				minDate = time.Date(fr.StartDate.Year(),
					fr.StartDate.Month(), fr.StartDate.Day(), 0, 0, 0,
					0, time.UTC)
			}
			if fr.EndDate.After(maxDate) {
				maxDate = time.Date(fr.EndDate.Year(),
					fr.EndDate.Month(), fr.EndDate.Day(), 0, 0, 0,
					0, time.UTC)
			}
		}
	}

	// get employees with assignments for the site that are assigned
	// during the forecast period.

	emps, err := services.GetEmployeesForTeam(lr.TeamID)
	if err != nil {
		return err
	}
	for _, emp := range emps {
		if emp.AtSite(lr.SiteID, minDate, maxDate) {
			// get work records for the year inclusive of the two
			// dates
			work, _ := services.GetEmployeeWork(emp.ID.Hex(),
				uint(minDate.Year()))
			if work != nil {
				emp.Work = append(emp.Work, work.Work...)
			}
			if minDate.Year() != maxDate.Year() {
				year := minDate.Year()
				for year < maxDate.Year() {
					year++
					work, _ = services.GetEmployeeWork(emp.ID.Hex(),
						uint(year))
					if work != nil {
						emp.Work = append(emp.Work, work.Work...)
					}
				}
			}
			lr.Employees = append(lr.Employees, emp)
		}
	}

	//////////////////////////////////////////////////////////
	// Report Creation
	//////////////////////////////////////////////////////////
	lr.CreateStyles()

	sort.Sort(dbdata.ByForecastReport(lr.ForecastReports))

	for _, fr := range lr.ForecastReports {
		// current report
		lr.CreateContractReport(fr, true)

		// forecast report
		lr.CreateContractReport(fr, false)
	}
	return nil
}

func (lr *LaborReport) CreateStyles() error {
	numFmt := "##0.0;[Red]##0.0;-;@"
	sumFmt := "_(* #,##0.0_);_(* (#,##0.0);_(* \"-\"??_);_(@_)"
	style, err := lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 0},
			{Type: "top", Color: "000000", Style: 0},
			{Type: "right", Color: "000000", Style: 0},
			{Type: "bottom", Color: "000000", Style: 0},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 18, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["header"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 0},
			{Type: "top", Color: "000000", Style: 0},
			{Type: "right", Color: "000000", Style: 0},
			{Type: "bottom", Color: "000000", Style: 0},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 14, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["label"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 0},
			{Type: "top", Color: "000000", Style: 0},
			{Type: "right", Color: "000000", Style: 0},
			{Type: "bottom", Color: "000000", Style: 0},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 14, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["periods"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 2},
			{Type: "top", Color: "000000", Style: 2},
			{Type: "right", Color: "000000", Style: 2},
			{Type: "bottom", Color: "000000", Style: 2},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 18, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["month"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 2},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 14, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["monthsumlbl"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 14, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["dates"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 2},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 2},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"da9694"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["monthdate"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffff00"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["weeks"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"000000"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 12, Color: "ffffff", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["peopleheader"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["peoplectr"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["peopleleft"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"fcd5b4"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["liasonctr"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"fcd5b4"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["liasonleft"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"DA9694"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center",
			WrapText: true},
		CustomNumFmt: &numFmt,
	})
	if err != nil {
		return err
	}
	lr.Styles["sum"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"DA9694"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center",
			WrapText: true},
		CustomNumFmt: &sumFmt,
	})
	if err != nil {
		return err
	}
	lr.Styles["sum"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"DA9694"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center",
			WrapText: true},
		CustomNumFmt: &sumFmt,
	})
	if err != nil {
		return err
	}
	lr.Styles["monthsum"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"bfbfbf"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
		CustomNumFmt: &sumFmt,
	})
	if err != nil {
		return err
	}
	lr.Styles["actual"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"bfbfbf"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 12, Color: "0000ff", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
		CustomNumFmt: &sumFmt,
	})
	if err != nil {
		return err
	}
	lr.Styles["forecast"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"bfbfbf"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Size: 12, Color: "000000", Family: "Calibri Light"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center",
			WrapText: true},
		CustomNumFmt: &sumFmt,
	})
	if err != nil {
		return err
	}
	lr.Styles["cellsum"] = style

	// conditional styles
	// slin/wbs yellowed or greened
	format, err := lr.Report.NewConditionalStyle(
		&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
			},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"c6efce"}, Pattern: 1},
			Font: &excelize.Font{Bold: false, Size: 12, Color: "006100", Family: "Calibri Light"},
			Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
				WrapText: true},
		},
	)
	if err != nil {
		return err
	}
	lr.ConditionalStyles["greened"] = format

	format, err = lr.Report.NewConditionalStyle(
		&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
			},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"ffeb9c"}, Pattern: 1},
			Font: &excelize.Font{Bold: false, Size: 12, Color: "9c6500", Family: "Calibri Light"},
			Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
				WrapText: true},
		},
	)
	if err != nil {
		return err
	}
	lr.ConditionalStyles["yellowed"] = format

	format, err = lr.Report.NewConditionalStyle(
		&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
			},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"ffeb9c"}, Pattern: 1},
			Font: &excelize.Font{Bold: false, Size: 12, Color: "9c6500", Family: "Calibri Light"},
			Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center",
				WrapText: true},
		},
	)
	if err != nil {
		return err
	}
	lr.ConditionalStyles["greenedright"] = format

	format, err = lr.Report.NewConditionalStyle(
		&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
			},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"ffeb9c"}, Pattern: 1},
			Font: &excelize.Font{Bold: false, Size: 12, Color: "9c6500", Family: "Calibri Light"},
			Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center",
				WrapText: true},
		},
	)
	if err != nil {
		return err
	}
	lr.ConditionalStyles["yellowed"] = format

	format, err = lr.Report.NewConditionalStyle(
		&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
			},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"ffb5b5"}, Pattern: 1},
			Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
			Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
				WrapText: true},
			CustomNumFmt: &numFmt,
		},
	)
	if err != nil {
		return err
	}
	lr.ConditionalStyles["cellpink"] = format

	format, err = lr.Report.NewConditionalStyle(
		&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
			},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"ffb5b5"}, Pattern: 1},
			Font: &excelize.Font{Bold: false, Size: 12, Color: "000000", Family: "Calibri Light"},
			Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center",
				WrapText: true},
			CustomNumFmt: &sumFmt,
		},
	)
	if err != nil {
		return err
	}
	lr.ConditionalStyles["pinkright"] = format

	return nil
}

func (lr *LaborReport) CreateContractReport(
	fr dbdata.ForecastReport, current bool) error {
	sheetName := fr.Name + "_"
	if current {
		sheetName += "Current"
	} else {
		sheetName += "Forecast"
	}
	lr.Report.NewSheet(sheetName)
	options := excelize.ViewOptions{}
	options.ShowGridLines = &[]bool{false}[0]
	lr.Report.SetSheetView(sheetName, 0, &options)

	// set column widths
	lr.Report.SetColWidth(sheetName, "A", "A", 8.0)
	lr.Report.SetColWidth(sheetName, "B", "B", 10.57)
	lr.Report.SetColWidth(sheetName, "C", "C", 9.0)
	lr.Report.SetColWidth(sheetName, "D", "D", 14.57)
	lr.Report.SetColWidth(sheetName, "E", "E", 10.57)
	lr.Report.SetColWidth(sheetName, "F", "F", 20.0)
	lr.Report.SetColWidth(sheetName, "G", "G", 18.14)
	lr.Report.SetColWidth(sheetName, "H", "H", 17.57)
	lr.Report.SetColWidth(sheetName, "I", "K", 14.57)
	lr.Report.SetColWidth(sheetName, "L", "L", 55.14)
	columns := 13
	for _, period := range fr.Periods {
		columns += len(period.Periods) + 1
	}
	lr.Report.SetColWidth(sheetName, "M", GetColumn(columns), 15.43)

	// headers for page
	style := lr.Styles["header"]
	lr.Report.SetCellStyle(sheetName, "A1", "G1", style)
	lr.Report.MergeCell(sheetName, "A1", "G1")
	lr.Report.SetCellValue(sheetName, "A1", "FFP Labor: "+
		"CLIN "+fr.LaborCodes[0].CLIN+" SUMMARY")

	lr.Report.SetCellStyle(sheetName, "A2", "G2", style)
	lr.Report.MergeCell(sheetName, "A2", "G2")
	lr.Report.SetCellValue(sheetName, "A2", fr.Name+
		"Year - "+fr.StartDate.Format("02 Jan 06")+" "+
		fr.EndDate.Format("02 Jan 06"))

	style = lr.Styles["label"]
	lr.Report.SetCellStyle(sheetName, "L1", "L1", style)
	lr.Report.SetCellValue(sheetName, "L1",
		"Weeks Per Accounting Month")
	lr.Report.SetCellStyle(sheetName, "L2", "L2", style)
	lr.Report.SetCellValue(sheetName, "L2",
		"Accounting Month")
	lr.Report.SetCellStyle(sheetName, "L3", "L3", style)
	lr.Report.SetCellValue(sheetName, "L3",
		"Week Ending")

	column := 13
	for _, period := range fr.Periods {
		style = lr.Styles["periods"]
		lr.Report.SetCellStyle(sheetName, GetCellID(column, 1),
			GetCellID(column, 1), style)
		lr.Report.SetCellValue(sheetName, GetCellID(column, 1),
			strconv.Itoa(len(period.Periods)))
		style = lr.Styles["month"]
		lr.Report.SetCellStyle(sheetName, GetCellID(column, 2),
			GetCellID(column+len(period.Periods), 2), style)
		lr.Report.MergeCell(sheetName, GetCellID(column, 2),
			GetCellID(column+len(period.Periods), 2))
		lr.Report.SetCellValue(sheetName, GetCellID(column, 2),
			strings.ToUpper(period.Month.Format("January")))
		style = lr.Styles["monthsumlbl"]
		lr.Report.SetCellStyle(sheetName, GetCellID(column, 3),
			GetCellID(column, 3), style)
		lr.Report.SetCellValue(sheetName, GetCellID(column, 3),
			"Month Total")
		lr.Report.SetColOutlineLevel(sheetName, GetColumn(column), 1)
		style = lr.Styles["dates"]
		for i, prd := range period.Periods {
			cellID := GetCellID(column+i+1, 3)
			lr.Report.SetCellStyle(sheetName, cellID, cellID, style)
			lr.Report.SetCellValue(sheetName, cellID, prd.Format("_1/_2/06"))
			lr.Report.SetColOutlineLevel(sheetName, GetColumn(column+i+1), 2)
		}
		column += len(period.Periods) + 1
	}
	style = lr.Styles["monthsumlbl"]
	cellID := GetCellID(column, 3)
	lr.Report.SetCellStyle(sheetName, cellID, cellID, style)
	lr.Report.SetCellValue(sheetName, cellID, "EAC")

	return nil
}

func (lr *LaborReport) CreateStatisticsReport() error {
	sheetName := "Statistics"
	lr.Report.NewSheet(sheetName)
	options := excelize.ViewOptions{}
	options.ShowGridLines = &[]bool{false}[0]
	lr.Report.SetSheetView(sheetName, 0, &options)

	return nil
}
