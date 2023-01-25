package web

import "time"

type NewSiteRequest struct {
	TeamID string `json:"team"`
	SiteID string `json:"siteid"`
	Name   string `json:"name"`
}

type NewSiteWorkcenter struct {
	TeamID  string `json:"team"`
	SiteID  string `json:"siteid"`
	WkctrID string `json:"wkctrid"`
	Name    string `json:"name"`
}

type SiteWorkcenterUpdate struct {
	TeamID  string `json:"team"`
	SiteID  string `json:"siteid"`
	WkctrID string `json:"wkctrid"`
	Field   string `json:"field"`
	Value   string `json:"value"`
}

type NewWorkcenterPosition struct {
	TeamID     string `json:"team"`
	SiteID     string `json:"siteid"`
	WkctrID    string `json:"wkctrid"`
	PositionID string `json:"positionid"`
	Name       string `json:"name"`
}

type WorkcenterPositionUpdate struct {
	TeamID     string `json:"team"`
	SiteID     string `json:"siteid"`
	WkctrID    string `json:"wkctrid"`
	PositionID string `json:"positionid"`
	Field      string `json:"field"`
	Value      string `json:"value"`
}

type NewSiteLaborCode struct {
	TeamID           string `json:"team"`
	SiteID           string `json:"siteid"`
	ChargeNumber     string `json:"chargeNumber"`
	Extension        string `json:"extension"`
	CLIN             string `json:"clin,omitempty"`
	SLIN             string `json:"slin,omitempty"`
	Location         string `json:"location,omitempty"`
	WBS              string `json:"wbs,omitempty"`
	MinimumEmployees string `json:"minimumEmployees,omitempty"`
	NotAssignedName  string `json:"notAssignedName,omitempty"`
	HoursPerEmployee string `json:"hoursPerEmployee,omitempty"`
	Exercise         string `json:"exercise,omitempty"`
	StartDate        string `json:"startDate,omitempty"`
	EndDate          string `json:"endDate,omitempty"`
}

type UpdateSiteLaborCode struct {
	TeamID       string `json:"team"`
	SiteID       string `json:"siteid"`
	ChargeNumber string `json:"chargeNumber"`
	Extension    string `json:"extension"`
	Field        string `json:"field"`
	Value        string `json:"value"`
}

type CreateSiteForecast struct {
	TeamID    string    `json:"team"`
	SiteID    string    `json:"siteid"`
	Name      string    `json:"name"`
	StartDate time.Time `json:"startdate"`
	EndDate   time.Time `json:"enddate"`
}

type UpdateSiteForecast struct {
	TeamID   string `json:"team"`
	SiteID   string `json:"siteid"`
	ReportID int    `json:"reportid"`
	Field    string `json:"field"`
	Value    string `json:"value"`
}
