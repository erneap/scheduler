package sites

import (
	"strings"
	"time"
)

type LaborCode struct {
	ChargeNumber     string    `json:"chargeNumber" bson:"chargeNumber"`
	Extension        string    `json:"extension" bson:"extension"`
	CLIN             string    `json:"clin" bson:"clin"`
	SLIN             string    `json:"slin" bson:"slin"`
	Location         string    `json:"location" bson:"location"`
	WBS              string    `json:"wbs" bson:"wbs"`
	MinimumEmployees int       `json:"minimumEmployees" bson:"minimumEmployees"`
	NotAssignedName  string    `json:"notAssignedName" bson:"notAssignedName"`
	HoursPerEmployee float64   `json:"hoursPerEmployee" bson:"hoursPerEmployee"`
	Exercise         bool      `json:"exercise" bson:"exercise"`
	StartDate        time.Time `json:"startDate" bson:"startDate"`
	EndDate          time.Time `json:"endDate" bson:"endDate"`
}

type ByLaborCode []LaborCode

func (c ByLaborCode) Len() int { return len(c) }
func (c ByLaborCode) Less(i, j int) bool {
	if strings.EqualFold(c[i].ChargeNumber, c[j].ChargeNumber) {
		return c[i].Extension < c[j].Extension
	}
	return c[i].ChargeNumber < c[j].Extension
}
func (c ByLaborCode) Swap(i, j int) { c[i], c[j] = c[j], c[i] }
