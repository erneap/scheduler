package reports

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/sites"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/xuri/excelize/v2"
)

type LeaveMonth struct {
	Month   *time.Time
	Holiday *sites.CompanyHoliday
	Disable bool
	Periods []LeavePeriod
}

type ByLeaveMonth []LeaveMonth

func (c ByLeaveMonth) Len() int { return len(c) }
func (c ByLeaveMonth) Less(i, j int) bool {
	if c[i].Holiday != nil {
		if c[i].Holiday.ID == c[j].Holiday.ID {
			return c[i].Holiday.SortID < c[j].Holiday.SortID
		}
		return strings.EqualFold(c[i].Holiday.ID, "H")
	}
	return c[i].Month.Before(*c[j].Month)
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

func (lm *LeaveMonth) GetHours() float64 {
	hours := 0.0
	for _, lvPer := range lm.Periods {
		for _, lv := range lvPer.Leaves {
			hours += lv.Hours
		}
	}
	return hours
}

func (lm *LeaveMonth) GetHolidayHours() float64 {
	hours := 0.0
	for _, lvPer := range lm.Periods {
		if strings.EqualFold(lvPer.Code, "H") {
			for _, lv := range lvPer.Leaves {
				if strings.EqualFold(lv.Status, "actual") {
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

func (lp *LeavePeriod) GetHours() float64 {
	hours := 0.0
	for _, lv := range lp.Leaves {
		hours += lv.Hours
	}
	return hours
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
	BHolidays bool
	Holidays  []LeaveMonth
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
			lr.BHolidays = len(com.Holidays) > 0
			for _, hol := range com.Holidays {
				holiday := &sites.CompanyHoliday{
					ID:     hol.ID,
					SortID: hol.SortID,
					Name:   hol.Name,
				}
				holiday.ActualDates = append(holiday.ActualDates, hol.ActualDates...)
				h := LeaveMonth{
					Holiday: holiday,
				}
				lr.Holidays = append(lr.Holidays, h)
			}
			sort.Sort(ByLeaveMonth(lr.Holidays))
		}
	}

	lr.CreateStyles()

	lr.CreateLeaveListing()

	lr.Report.DeleteSheet("Sheet1")

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

	numFmt := "0.0;mm/dd/yyyy;@"
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
		CustomNumFmt: &numFmt,
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
		Font: &excelize.Font{Bold: false, Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
		CustomNumFmt: &numFmt,
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
		CustomNumFmt: &numFmt,
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
		CustomNumFmt: &numFmt,
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
		CustomNumFmt: &numFmt,
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
		CustomNumFmt: &numFmt,
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
		Fill: excelize.Fill{Type: "pattern", Color: []string{"999999"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
	})
	if err != nil {
		return err
	}
	lr.Styles["disabled"] = style

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

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center",
			WrapText: true},
		CustomNumFmt: &numFmt,
	})
	if err != nil {
		return err
	}
	lr.Styles["ptodates"] = style

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
		CustomNumFmt: &numFmt,
	})
	if err != nil {
		return err
	}
	lr.Styles["ptotaken"] = style

	style, err = lr.Report.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"ffffff"}, Pattern: 1},
		Font: &excelize.Font{Bold: false, Size: 10, Color: "3366ff"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center",
			WrapText: true},
		CustomNumFmt: &numFmt,
	})
	if err != nil {
		return err
	}
	lr.Styles["ptorequest"] = style

	return nil
}

func (lr *LeaveReport) CreateLeaveListing() error {
	sheetName := "Leave Listing"
	lr.Report.NewSheet(sheetName)
	options := excelize.ViewOptions{}
	options.ShowGridLines = &[]bool{false}[0]
	lr.Report.SetSheetView(sheetName, 0, &options)

	extendedWidth := 3
	fmt.Println(lr.BHolidays)
	if lr.BHolidays {
		extendedWidth += 4
	}

	// months
	var months []LeaveMonth
	for i := 0; i < 12; i++ {
		dtMonth := time.Date(lr.Year, time.Month(i+1), 1, 0, 0, 0, 0, time.UTC)
		month := LeaveMonth{
			Month:   &dtMonth,
			Holiday: nil,
		}
		months = append(months, month)
	}

	// set column widths
	if lr.BHolidays {
		lr.Report.SetColWidth(sheetName, GetColumn(0), GetColumn(0), 4.0)
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
		if lr.BHolidays {
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
		if lr.BHolidays {
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
							Size:  8,
							Color: "000000",
						},
					},
					{
						Text: "Projected",
						Font: &excelize.Font{
							Bold:  true,
							Size:  8,
							Color: "3366ff",
						},
					},
					{
						Text: ")",
						Font: &excelize.Font{
							Bold:  true,
							Size:  8,
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
						Size:  8,
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
						Size:  8,
						Color: "000000",
					},
				},
				{
					Text: "Projected",
					Font: &excelize.Font{
						Bold:  true,
						Size:  8,
						Color: "3366ff",
					},
				},
				{
					Text: ")",
					Font: &excelize.Font{
						Bold:  true,
						Size:  8,
						Color: "000000",
					},
				},
			})
		holRow := 0
		lvRow := 0
		startAsgmt := emp.Data.Assignments[0]
		endAsgmt := emp.Data.Assignments[len(emp.Data.Assignments)-1]
		// clear months
		for m, month := range months {
			month.Periods = month.Periods[:0]
			month.Disable = startAsgmt.StartDate.After(*month.Month) ||
				endAsgmt.EndDate.Before(*month.Month)
			months[m] = month
		}
		// clear holidays periods
		for h, hol := range lr.Holidays {
			actual := hol.Holiday.GetActual(lr.Year)
			hol.Periods = hol.Periods[:0]
			if actual != nil {
				hol.Disable = hol.Holiday.ID[0:1] == "H" &&
					startAsgmt.StartDate.After(*actual) ||
					endAsgmt.EndDate.Before(*actual)
			} else {
				hol.Disable = false
			}
			lr.Holidays[h] = hol
		}

		sort.Sort(employees.ByLeaveDay(emp.Data.Leaves))
		std := emp.GetStandardWorkday(time.Date(lr.Year, 1, 1, 0, 0, 0, 0, time.UTC))

		for _, lv := range emp.Data.Leaves {
			if lv.LeaveDate.Year() == lr.Year {
				if strings.EqualFold(lv.Code, "H") {
					bFound := false
					for h, hol := range lr.Holidays {
						if !bFound {
							if hol.GetHours() < 8.0 {
								if hol.GetHours()+lv.Hours <= 8.0 {
									bFound = true
									prd := LeavePeriod{
										Code:      lv.Code,
										StartDate: lv.LeaveDate,
										EndDate:   lv.LeaveDate,
										Status:    lv.Status,
									}
									prd.Leaves = append(prd.Leaves, lv)
									hol.Periods = append(hol.Periods, prd)
									lr.Holidays[h] = hol
								}
							}
						}
					}
				} else {
					for m, month := range months {
						if month.Month.Year() == lv.LeaveDate.Year() &&
							month.Month.Month() == lv.LeaveDate.Month() {
							bFound := false
							for p, prd := range month.Periods {
								if strings.EqualFold(prd.Code, lv.Code) &&
									strings.EqualFold(prd.Status, lv.Status) &&
									prd.EndDate.Day()+1 == lv.LeaveDate.Day() &&
									!bFound && lv.Hours >= std && prd.GetHours() >= std {
									bFound = true
									prd.Leaves = append(prd.Leaves, lv)
									prd.EndDate = lv.LeaveDate
									month.Periods[p] = prd
								}
							}
							if !bFound {
								prd := LeavePeriod{
									Code:      lv.Code,
									StartDate: lv.LeaveDate,
									EndDate:   lv.LeaveDate,
									Status:    lv.Status,
								}
								prd.Leaves = append(prd.Leaves, lv)
								month.Periods = append(month.Periods, prd)
							}
							months[m] = month
						}
					}
				}
			}
		}
		now := time.Now().UTC()
		col = 0
		var richText []excelize.RichTextRun
		if lr.BHolidays {
			sort.Sort(ByLeaveMonth(lr.Holidays))
			for _, hol := range lr.Holidays {
				holRow++
				sStyle := "hollblactual"
				if hol.Disable {
					sStyle = "disabled"
				} else {
					if hol.Holiday.GetActual(lr.Year) != nil &&
						hol.Holiday.GetActual(lr.Year).After(now) {
						sStyle = "hollblsched"
					}
				}
				style := lr.Styles[sStyle]
				lr.Report.SetCellStyle(sheetName, GetCellID(0, row+holRow),
					GetCellID(3, row+holRow), style)
				lr.Report.SetCellValue(sheetName, GetCellID(0, row+holRow),
					fmt.Sprintf("%s%d", hol.Holiday.ID, hol.Holiday.SortID))
				if hol.Holiday.GetActual(lr.Year) != nil {
					lr.Report.SetCellValue(sheetName, GetCellID(1, row+holRow),
						hol.Holiday.GetActual(lr.Year).Format("02-Jan-06"))
				} else {
					lr.Report.SetCellValue(sheetName, GetCellID(1, row+holRow), "")
				}
				lr.Report.SetCellValue(sheetName, GetCellID(3, row+holRow),
					hol.GetHolidayHours())
				richText = richText[:0]
				for _, prd := range hol.Periods {
					for _, lv := range prd.Leaves {
						if strings.EqualFold(lv.Status, "actual") {
							if len(richText) > 0 {
								comma := &excelize.RichTextRun{
									Text: ",",
									Font: &excelize.Font{
										Bold:  true,
										Size:  10,
										Color: "000000",
									},
								}
								richText = append(richText, *comma)
							}
							tr := &excelize.RichTextRun{
								Text: lv.LeaveDate.Format("02 Jan"),
								Font: &excelize.Font{
									Bold:  true,
									Size:  10,
									Color: "000000",
								},
							}
							richText = append(richText, *tr)
							if lv.Hours < 8.0 {
								tr = &excelize.RichTextRun{
									Text: "(" + fmt.Sprintf("%.1f", lv.Hours) + ")",
									Font: &excelize.Font{
										Bold:      true,
										Size:      7,
										Color:     "000000",
										VertAlign: "superscript",
									},
								}
								richText = append(richText, *tr)
							}
						} else {
							if len(richText) > 0 {
								comma := &excelize.RichTextRun{
									Text: ",",
									Font: &excelize.Font{
										Bold:  true,
										Size:  10,
										Color: "000000",
									},
								}
								richText = append(richText, *comma)
							}
							tr := &excelize.RichTextRun{
								Text: lv.LeaveDate.Format("02 Jan"),
								Font: &excelize.Font{
									Bold:  true,
									Size:  10,
									Color: "3366ff",
								},
							}
							richText = append(richText, *tr)
							if lv.Hours < 8.0 {
								tr = &excelize.RichTextRun{
									Text: "(" + fmt.Sprintf("%.1f", lv.Hours) + ")",
									Font: &excelize.Font{
										Bold:      true,
										Size:      7,
										Color:     "3366ff",
										VertAlign: "superscript",
									},
								}
								richText = append(richText, *tr)
							}
						}
					}
				}
				lr.Report.SetCellRichText(sheetName, GetCellID(2, row+holRow), richText)
			}
			col = 4
		}
		sort.Sort(ByLeaveMonth(months))
		for _, month := range months {
			lvRow++
			style := lr.Styles["ptodates"]
			if month.Disable {
				style = lr.Styles["disabled"]
			}
			lr.Report.SetCellStyle(sheetName, GetCellID(col+0, row+lvRow),
				GetCellID(col+1, row+lvRow), style)
			lr.Report.MergeCell(sheetName, GetCellID(col+0, row+lvRow),
				GetCellID(col+1, row+lvRow))
			style = lr.Styles["ptotaken"]
			if month.Disable {
				style = lr.Styles["disabled"]
			}
			lr.Report.SetCellStyle(sheetName, GetCellID(col+2, row+lvRow),
				GetCellID(col+2, row+lvRow), style)
			lr.Report.SetCellValue(sheetName, GetCellID(col+2, row+lvRow),
				month.GetPTOActual())
			style = lr.Styles["ptorequest"]
			if month.Disable {
				style = lr.Styles["disabled"]
			}
			lr.Report.SetCellStyle(sheetName, GetCellID(col+3, row+lvRow),
				GetCellID(col+3, row+lvRow), style)
			lr.Report.SetCellValue(sheetName, GetCellID(col+3, row+lvRow),
				month.GetPTOSchedule())

			richText = richText[:0]
			bComma := false

			rt := &excelize.RichTextRun{
				Text: month.Month.Format("Jan") + ": ",
				Font: &excelize.Font{
					Bold:  true,
					Size:  10,
					Color: "ff0000",
				},
			}
			richText = append(richText, *rt)
			for _, prd := range month.Periods {
				if bComma {
					comma := &excelize.RichTextRun{
						Text: ",",
						Font: &excelize.Font{
							Bold:  true,
							Size:  10,
							Color: "000000",
						},
					}
					richText = append(richText, *comma)
				}
				wc := lr.Workcodes[prd.Code]
				text := ""
				if !prd.StartDate.Equal(prd.EndDate) {
					text = prd.StartDate.Format("2") + "-" +
						prd.EndDate.Format("2")
				} else {
					text = prd.StartDate.Format("2")
				}
				rt = &excelize.RichTextRun{
					Text: text,
					Font: &excelize.Font{
						Bold:  true,
						Size:  10,
						Color: wc.BackColor,
					},
				}
				richText = append(richText, *rt)
				if len(prd.Leaves) == 1 && prd.Leaves[0].Hours < std {
					rt = &excelize.RichTextRun{
						Text: "(" + fmt.Sprintf("%.1f", prd.Leaves[0].Hours) + ")",
						Font: &excelize.Font{
							Bold:      true,
							Size:      10,
							Color:     wc.BackColor,
							VertAlign: "superscript",
						},
					}
					richText = append(richText, *rt)
				}
				bComma = true
			}
			lr.Report.SetCellRichText(sheetName, GetCellID(col, row+lvRow), richText)
		}

		if holRow > lvRow {
			row += holRow
		} else {
			row += lvRow
		}

		row++
	}

	return nil
}
