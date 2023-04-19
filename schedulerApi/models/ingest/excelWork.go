package ingest

import "time"

type ExcelRow struct {
	Date         time.Time
	CompanyID    string
	Preminum     string
	ChargeNumber string
	Extension    string
	Code         string
	Hours        float64
}
