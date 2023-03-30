package sites

import (
	"sort"
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

func (r *ForecastReport) ChangePeriodsStart(weekday int) {
	end := time.Date(r.EndDate.Year(), r.EndDate.Month(), r.EndDate.Day(), 0, 0,
		0, 0, time.UTC)
	for int(end.Weekday()) != weekday {
		end = end.AddDate(0, 0, 1)
	}
	end = end.AddDate(0, 0, 1)
	start := time.Date(r.StartDate.Year(), r.StartDate.Month(), r.StartDate.Day(),
		0, 0, 0, 0, time.UTC)
	for int(start.Weekday()) != weekday {
		start = start.AddDate(0, 0, 1)
	}

	// clear the monthly periods of the forecast
	for i, prds := range r.Periods {
		prds.Periods = prds.Periods[:0]
		r.Periods[i] = prds
	}

	for start.Before(end) {
		found := false
		for p, prd := range r.Periods {
			if prd.Month.Year() == start.Year() && prd.Month.Month() == start.Month() {
				prd.Periods = append(prd.Periods, start)
				found = true
				r.Periods[p] = prd
			}
		}
		if !found {
			prd := r.Periods[len(r.Periods)-1]
			prd.Periods = append(prd.Periods, start)
			r.Periods[len(r.Periods)-1] = prd
		}
		start = start.AddDate(0, 0, 7)
	}
}

func (r *ForecastReport) MovePeriodBetweenMonths(from, to, oPrd time.Time) {
	var fromPrd *ForecastPeriod
	var toPrd *ForecastPeriod
	fromPos := -1
	toPos := -1
	for i, prd := range r.Periods {
		if prd.Month.Equal(from) {
			fromPos = i
			fromPrd = &prd
		} else if prd.Month.Equal(to) {
			toPos = i
			toPrd = &prd
		}
	}
	toPrd.Periods = append(toPrd.Periods, oPrd)
	sort.Slice(toPrd.Periods, func(i, j int) bool {
		return toPrd.Periods[i].Before(toPrd.Periods[j])
	})
	pos := -1
	for i, prd := range fromPrd.Periods {
		if prd.Equal(oPrd) {
			pos = i
		}
	}
	if pos >= 0 {
		fromPrd.Periods = append(fromPrd.Periods[:pos], fromPrd.Periods[pos+1:]...)
		sort.Slice(fromPrd.Periods, func(i, j int) bool {
			return fromPrd.Periods[i].Before(fromPrd.Periods[j])
		})
	}
	r.Periods[fromPos] = *fromPrd
	r.Periods[toPos] = *toPrd
}
