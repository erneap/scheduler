package web

import (
	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/sites"
	"github.com/erneap/scheduler/schedulerApi/models/users"
)

type AuthenticationResponse struct {
	User      *users.User         `json:"user,omitempty"`
	Token     string              `json:"token"`
	Employee  *employees.Employee `json:"employee,omitempty"`
	Site      *sites.Site         `json:"site,omitempty"`
	Team      *sites.Team         `json:"team,omitempty"`
	Exception string              `json:"exception"`
}

type EmployeeResponse struct {
	Employee  *employees.Employee `json:"employee,omitempty"`
	Exception string              `json:"exception"`
}

type SiteResponse struct {
	Team      *sites.Team `json:"team,omitempty"`
	Site      *sites.Site `json:"site,omitempty"`
	Exception string      `json:"exception"`
}

type IngestResponse struct {
	Employees  []employees.Employee `json:"employees"`
	IngestType string               `json:"ingest"`
	Exception  string               `json:"exception"`
}

type UsersResponse struct {
	Users     []users.User `json:"users"`
	Exception string       `json:"exception"`
}
