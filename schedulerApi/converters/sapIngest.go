package converters

import (
	"log"
	"mime/multipart"
	"strings"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/ingest"
	"github.com/xuri/excelize/v2"
)

type SAPIngest struct {
	Files []*multipart.FileHeader
}

func (s *SAPIngest) Process() ([]ingest.ExcelRow, time.Time, time.Time) {
	start := time.Now()
	end := time.Now()
	var records []ingest.ExcelRow
	for _, file := range s.Files {
		recs, fStart, fEnd := s.ProcessFile(file)
		records = append(records, recs...)
		if fStart.Before(start) {
			start = fStart
		}
		if fEnd.After(end) {
			end = fEnd
		}
	}
	return records, start, end
}

func (s *SAPIngest) ProcessFile(file *multipart.FileHeader) ([]ingest.ExcelRow, time.Time, time.Time) {
	readerFile, _ := file.Open()
	f, err := excelize.OpenReader(readerFile)
	if err != nil {
		log.Println(err)
	}
	sheetName := f.GetSheetName(0)

	columns := make(map[string]int)

	rows, err := f.GetRows(sheetName)
	if err != nil {
		log.Println(err)
	}
	startDate := time.Now()
	endDate := time.Now()
	var records []ingest.ExcelRow
	for i, row := range rows {
		if i == 0 {
			for j, colCell := range row {
				columns[colCell] = j
			}
		} else {
			explanation := row[columns["Explanation"]]
			description := row[columns["Charge Number Desc"]]
			if !strings.Contains(explanation, "Total") {
				date := ParseDate(row[columns["Date"]])
				if date.Before(startDate) {
					startDate = time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0,
						0, time.UTC)
				}
				if date.After(endDate) {
					endDate = time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0,
						0, time.UTC)
				}
				companyID := row[columns["Personnel no."]]
				chargeNo := row[columns["Charge Number"]]
				premimum := row[columns["Prem. no."]]
				extension := row[columns["Ext."]]
				hours := ParseFloat(row[columns["Hours"]])
				// check to see if ingest row is for a leave type record
				if strings.Contains(strings.ToLower(description), "leave") ||
					strings.EqualFold(description, "pto") ||
					strings.Contains(strings.ToLower(description), "holiday") {
					code := "V"
					parts := strings.Split(description, " ")
					switch strings.ToLower(parts[0]) {
					case "pto":
						code = "V"
					case "absence":
						code = "H"
					case "parental":
						code = "PL"
					case "military":
						code = "ML"
					case "jury":
						code = "J"
					}
					record := ingest.ExcelRow{
						Date:      date,
						CompanyID: companyID,
						Code:      code,
						Hours:     hours,
					}
					records = append(records, record)
					// else if the work record isn't for modified time then add as a work
					// record
				} else if !strings.Contains(strings.ToLower(description), "modified") {
					found := false
					for r, record := range records {
						if record.Date.Equal(date) && companyID == record.CompanyID &&
							record.Preminum == premimum && record.ChargeNumber == chargeNo &&
							record.Extension == extension {
							found = true
							hrs := record.Hours + hours
							records[r].Hours = hrs
						}
					}
					if !found {
						record := ingest.ExcelRow{
							Date:         date,
							CompanyID:    companyID,
							Preminum:     premimum,
							ChargeNumber: chargeNo,
							Extension:    extension,
							Hours:        hours,
						}
						records = append(records, record)
					}
				}
			}
		}
	}

	return records, startDate, endDate
}
