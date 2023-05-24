package web

import (
	"github.com/erneap/scheduler/schedulerApi/models/dbdata"
)

type AuthenticationResponse struct {
	User      *dbdata.User     `json:"user,omitempty"`
	Token     string           `json:"token"`
	Employee  *dbdata.Employee `json:"employee,omitempty"`
	Site      *dbdata.Site     `json:"site,omitempty"`
	Team      *dbdata.Team     `json:"team,omitempty"`
	Exception string           `json:"exception"`
}

type EmployeeResponse struct {
	Employee  *dbdata.Employee `json:"employee,omitempty"`
	Exception string           `json:"exception"`
}

type SiteResponse struct {
	Team      *dbdata.Team `json:"team,omitempty"`
	Site      *dbdata.Site `json:"site,omitempty"`
	Exception string       `json:"exception"`
}

type IngestResponse struct {
	Employees  []dbdata.Employee `json:"employees"`
	IngestType string            `json:"ingest"`
	Exception  string            `json:"exception"`
}

type UsersResponse struct {
	Users     []dbdata.User `json:"users"`
	Exception string        `json:"exception"`
}

type TeamsResponse struct {
	Teams     []dbdata.Team `json:"teams,omitempty"`
	Exception string        `json:"exception"`
}
