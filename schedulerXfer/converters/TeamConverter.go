package converters

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerXfer/models/config"
	"github.com/erneap/scheduler/schedulerXfer/models/sites"
	"github.com/xuri/excelize/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TeamConverter struct {
	BaseLocation string
	Team         sites.Team
}

func (t *TeamConverter) ReadTeam() {
	jsonFile, err := os.Open("initial.json")
	if err != nil {
		log.Println(err)
	}

	log.Println("Opened Initial Data JSON File")
	defer jsonFile.Close()

	// read all the data of the jsonFile into a byteArray
	byteArray, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		log.Println(err)
	}
	jsonString := string(byteArray)

	// unmarshall the json data into the team object
	err = json.Unmarshal([]byte(jsonString), &t.Team)
	if err != nil {
		log.Println(err)
	}
	log.Println(len(t.Team.Sites))

	log.Println("Team Read Complete")
}

func (t *TeamConverter) ReadCompanyHolidayDates() {
	log.Println("Reading Company Holiday Dates")

	// clear all the team's company holiday actual dates
	for i, comp := range t.Team.Companies {
		for j, hol := range comp.Holidays {
			if len(hol.ActualDates) > 0 {
				hol.ActualDates = hol.ActualDates[:0]
				comp.Holidays[j] = hol
			}
		}
		t.Team.Companies[i] = comp
	}

	// i'm only interested in dates from 2022 forward
	baseDate := time.Date(2021, 12, 31, 23, 59, 59, 0, time.UTC)

	if t.BaseLocation == "" {
		log.Fatal("Base Location is empty")
	}

	path := filepath.Join(t.BaseLocation, "HolidaySchedule.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("HolidaySchdule not present")
	}

	f, err := excelize.OpenFile(path)
	if err != nil {
		log.Fatal(err)
	}

	defer func() {
		if err := f.Close(); err != nil {
			log.Println(err)
		}
	}()

	// create map of column headers
	columns := make(map[string]int)

	rows, err := f.GetRows("HolidaySchedule")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colCell := range row {
				columns[colCell] = j
			}
		} else {
			tDate := ParseDate(row[columns["ActualDate"]])
			if tDate.After(baseDate) {
				holiday := row[columns["Code"]]
				company := row[columns["Company"]]
				if strings.ToLower(company) == "raytheon" {
					company = "rtx"
				}
				for j, comp := range t.Team.Companies {
					if strings.EqualFold(comp.ID, company) {
						for k, hol := range comp.Holidays {
							if strings.EqualFold(hol.ID, holiday) {
								hol.ActualDates = append(hol.ActualDates, tDate)
								comp.Holidays[k] = hol
								t.Team.Companies[j] = comp
							}
						}
					}
				}
			}
		}
	}
	log.Println("Completed Reading Company Holidays")
}

func (t *TeamConverter) ReadForecastReports() {
	log.Println("Reading Forecast Report")

	// clear all the dgs-c forecast reports
	for i, site := range t.Team.Sites {
		if len(site.ForecastReports) > 0 {
			site.ForecastReports = site.ForecastReports[:0]
			t.Team.Sites[i] = site
		}
	}

	// i'm only interested in dates from 2022 forward
	baseDate := time.Date(2022, 12, 31, 23, 59, 59, 0, time.UTC)

	if t.BaseLocation == "" {
		log.Fatal("Base Location is empty")
	}

	path := filepath.Join(t.BaseLocation, "ForecastReports.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("ForecastReports not present")
	}

	f, err := excelize.OpenFile(path)
	if err != nil {
		log.Fatal(err)
	}

	defer func() {
		if err := f.Close(); err != nil {
			log.Println(err)
		}
	}()

	// create map of column headers
	columns := make(map[string]int)

	rows, err := f.GetRows("ForecastReports")
	if err != nil {
		log.Fatal(err)
	}

	dgsc := t.Team.Sites[0]

	firstDate := time.Date(9999, 12, 30, 0, 0, 0, 0, time.UTC)

	for i, row := range rows {
		if i == 0 {
			for j, colCell := range row {
				columns[colCell] = j
			}
		} else {
			endDate := ParseDate(row[columns["EndDate"]])
			if endDate.After(baseDate) {
				rpt := sites.ForecastReport{
					ID:        ParseInt(row[columns["ID"]]),
					Name:      row[columns["ReportDescription"]],
					StartDate: ParseDate(row[columns["StartDate"]]),
					EndDate:   endDate,
				}
				if rpt.StartDate.Before(firstDate) {
					firstDate = rpt.StartDate
				}
				dgsc.ForecastReports = append(dgsc.ForecastReports, rpt)
			}
		}
	}
	t.ReadForecastPeriods(&dgsc, firstDate)
	t.ReadForecastLaborCodes(&dgsc)
	t.ReadSiteLaborCodes(&dgsc, firstDate)

	t.Team.Sites[0] = dgsc
}

func (t *TeamConverter) ReadForecastPeriods(dgsc *sites.Site, baseDate time.Time) {
	path := filepath.Join(t.BaseLocation, "ForecastPeriods.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("ForecastPeriods not present")
	}

	f, err := excelize.OpenFile(path)
	if err != nil {
		log.Fatal(err)
	}

	defer func() {
		if err := f.Close(); err != nil {
			log.Println(err)
		}
	}()

	// create map of column headers
	columns := make(map[string]int)

	rows, err := f.GetRows("ForecastPeriods")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colID := range row {
				columns[colID] = j
			}
		} else {
			fMonth := ParseDate(row[columns["FiscalMonth"]])
			if fMonth.Equal(baseDate) || fMonth.After(baseDate) {
				rptID := ParseInt(row[columns["ReportID"]])
				for j, rpt := range dgsc.ForecastReports {
					if rpt.ID == rptID {
						periods := row[columns["Periods"]]
						prds := strings.Split(periods, ",")
						p := sites.ForecastPeriod{
							Month: fMonth,
						}
						for _, d := range prds {
							dt := fmt.Sprintf("%d/%s", fMonth.Year(), d)
							tdate, err := time.Parse("2006/1/2", dt)
							if err != nil {
								fmt.Println(err)
							}
							if tdate.Before(fMonth) {
								tdate = tdate.AddDate(1, 0, 0)
							}
							p.Periods = append(p.Periods, tdate)
						}
						rpt.Periods = append(rpt.Periods, p)
						dgsc.ForecastReports[j] = rpt
					}
				}
			}
		}
	}
}

func (t *TeamConverter) ReadForecastLaborCodes(dgsc *sites.Site) {
	path := filepath.Join(t.BaseLocation, "ForecastChargeNumbers.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("ForecastChargeNumbers not present")
	}

	f, err := excelize.OpenFile(path)
	if err != nil {
		log.Fatal(err)
	}

	defer func() {
		if err := f.Close(); err != nil {
			log.Println(err)
		}
	}()

	// create map of column headers
	columns := make(map[string]int)

	rows, err := f.GetRows("ForecastChargeNumbers")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colID := range row {
				columns[colID] = j
			}
		} else {
			rptID := ParseInt(row[columns["ReportID"]])
			for j, rpt := range dgsc.ForecastReports {
				if rpt.ID == rptID {
					lc := sites.LaborCode{
						ChargeNumber: row[columns["ChargeNumber"]],
						Extension:    row[columns["Extension"]],
					}
					rpt.LaborCodes = append(rpt.LaborCodes, lc)
					sort.Sort(sites.ByLaborCode(rpt.LaborCodes))
					dgsc.ForecastReports[j] = rpt
				}
			}
		}
	}
}

func (t *TeamConverter) ReadSiteLaborCodes(dgsc *sites.Site, baseDate time.Time) {
	path := filepath.Join(t.BaseLocation, "LaborCodes.xlsx")
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		log.Fatal("LaborCodes not present")
	}

	f, err := excelize.OpenFile(path)
	if err != nil {
		log.Fatal(err)
	}

	defer func() {
		if err := f.Close(); err != nil {
			log.Println(err)
		}
	}()

	// create map of column headers
	columns := make(map[string]int)

	rows, err := f.GetRows("LaborCodes")
	if err != nil {
		log.Fatal(err)
	}

	for i, row := range rows {
		if i == 0 {
			for j, colID := range row {
				columns[colID] = j
			}
		} else {
			chargeNumnber := row[columns["WorkCode"]]
			extension := row[columns["Extension"]]
			for r, fcRpt := range dgsc.ForecastReports {
				for l, lc := range fcRpt.LaborCodes {
					if lc.ChargeNumber == chargeNumnber &&
						lc.Extension == extension {
						lc.CLIN = row[columns["CLIN"]]
						lc.SLIN = row[columns["SLIN"]]
						lc.Location = row[columns["Location"]]
						lc.WBS = row[columns["WBS"]]
						lc.NotAssignedName = row[columns["NoEmployeeName"]]
						lc.HoursPerEmployee = ParseFloat(row[columns["HoursPerEmployee"]])
						lc.Exercise = ParseBoolean(row[columns["ExerciseCode"]])
						lc.StartDate = ParseDate(row[columns["StartDate"]])
						lc.EndDate = ParseDate(row[columns["EndDate"]])
						fcRpt.LaborCodes[l] = lc
						dgsc.ForecastReports[r] = fcRpt
					}
				}
			}
		}
	}
}

func (t *TeamConverter) WriteTeam() *sites.Team {
	teamCollection := config.GetCollection(config.DB, "scheduler", "teams")

	teamCollection.DeleteMany(context.TODO(), bson.M{})

	t.Team.ID = primitive.NewObjectID()
	teamCollection.InsertOne(context.TODO(), t.Team)
	return &t.Team
}
