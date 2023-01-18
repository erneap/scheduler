package web

import (
	"github.com/erneap/scheduler/schedulerApi/models/employees"
	"github.com/erneap/scheduler/schedulerApi/models/users"
)

type AuthenticationResponse struct {
	User      *users.User         `json:"user,omitempty"`
	Token     string              `json:"token"`
	Employee  *employees.Employee `json:"employee,omitempty"`
	Exception string              `json:"exception"`
}
