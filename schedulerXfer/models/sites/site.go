package sites

import "github.com/erneap/scheduler/scheduler-xfer/models/employees"

type Site struct {
	ID              string               `json:"id" bson:"id"`
	Name            string               `json:"name" bson:"name"`
	Workcenters     []Workcenter         `json:"workcenters,omitempty" bson:"workcenters,omitempty"`
	LaborCodes      []LaborCode          `json:"laborCodes,omitempty" bson:"laborCodes,omitempty"`
	ForecastReports []ForecastReport     `json:"forecasts,omitempty" bson:"forecasts,omitempty"`
	Employees       []employees.Employee `json:"employees,omitempty" bson:"-"`
}

type BySites []Site

func (c BySites) Len() int { return len(c) }
func (c BySites) Less(i, j int) bool {
	return c[i].Name < c[j].Name
}
func (c BySites) Swap(i, j int) { c[i], c[j] = c[j], c[i] }
