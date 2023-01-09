package sites

import (
	"time"
)

type ForecastPeriod struct {
	Month   time.Time   `json:"month" bson:"month"`
	Periods []time.Time `json:"periods,omitempty" bson:"periods,omitempty"`
}

type ByForecastPeriod []ForecastPeriod

func (c ByForecastPeriod) Len() int { return len(c) }
func (c ByForecastPeriod) Less(i, j int) bool {
	return c[i].Month.Before(c[j].Month)
}
func (c ByForecastPeriod) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

type ForecastReport struct {
	ID         int              `json:"id" bson:"id"`
	Name       string           `json:"name" bson:"name"`
	StartDate  time.Time        `json:"startDate" bson:"startDate"`
	EndDate    time.Time        `json:"endDate" bson:"endDate"`
	Periods    []ForecastPeriod `json:"periods,omitempty" bson:"periods,omitempty"`
	LaborCodes []LaborCode      `json:"laborCodes,omitempty" bson:"laborCodes,omitempty"`
}

type ByForecastReport []ForecastReport

func (c ByForecastReport) Len() int { return len(c) }
func (c ByForecastReport) Less(i, j int) bool {
	if c[i].StartDate.Equal(c[j].StartDate) {
		if c[i].EndDate.Equal(c[j].EndDate) {
			return c[i].Name < c[j].Name
		}
		return c[i].EndDate.Before(c[j].EndDate)
	}
	return c[i].StartDate.Before(c[j].StartDate)
}
func (c ByForecastReport) Swap(i, j int) { c[i], c[j] = c[j], c[i] }
