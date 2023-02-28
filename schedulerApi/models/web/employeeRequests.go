package web

import (
	"log"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/employees"
)

type AuthenticationRequest struct {
	EmailAddress string `json:"emailAddress"`
	Password     string `json:"password"`
}

type UpdateRequest struct {
	ID         string `json:"id"`
	OptionalID string `json:"optional,omitempty"`
	Field      string `json:"field"`
	Value      any    `json:"value"`
}

func (ur *UpdateRequest) StringValue() string {
	return ur.Value.(string)
}

func (ur *UpdateRequest) NumberValue() uint {
	return ur.Value.(uint)
}

func (ur *UpdateRequest) BooleanValue() bool {
	return ur.Value.(bool)
}

type ChangePasswordRequest struct {
	ID       string `json:"id"`
	Password string `json:"password"`
}

type Message struct {
	Message string `json:"message"`
}

type NewEmployeeRequest struct {
	TeamID   string             `json:"team"`
	SiteID   string             `json:"site"`
	Employee employees.Employee `json:"employee"`
	Password string             `json:"password"`
}

type NewEmployeeAssignment struct {
	EmployeeID   string    `json:"employee"`
	SiteID       string    `json:"site"`
	Workcenter   string    `json:"workcenter"`
	StartDate    time.Time `json:"start"`
	ScheduleDays int       `json:"scheduledays"`
}

type ChangeAssignmentRequest struct {
	EmployeeID   string `json:"employee"`
	AssignmentID uint   `json:"asgmt"`
	ScheduleID   uint   `json:"schedule,omitempty"`
	WorkdayID    uint   `json:"workday,omitempty"`
	Field        string `json:"field"`
	Value        any    `json:"value"`
}

func (ur *ChangeAssignmentRequest) StringValue() string {
	return ur.Value.(string)
}

func (ur *ChangeAssignmentRequest) NumberValue() uint {
	return ur.Value.(uint)
}

func (ur *ChangeAssignmentRequest) IntValue() int {
	return ur.Value.(int)
}

func (ur *ChangeAssignmentRequest) FloatValue() float64 {
	return ur.Value.(float64)
}

func (ur *ChangeAssignmentRequest) BooleanValue() bool {
	return ur.Value.(bool)
}

func (ur *ChangeAssignmentRequest) DateValue() time.Time {
	dateValue, err := time.ParseInLocation("2006-01-02",
		ur.Value.(string), time.UTC)
	if err != nil {
		log.Println(err.Error())
	}
	return dateValue
}

type NewEmployeeVariation struct {
	EmployeeID string    `json:"employee"`
	SiteID     string    `json:"site"`
	IsMids     bool      `json:"mids"`
	StartDate  time.Time `json:"start"`
	EndDate    time.Time `json:"end"`
	Workcenter string    `json:"workcenter"`
	Code       string    `json:"code"`
	Hours      float64   `json:"hours"`
	DaysOff    string    `json:"daysoff"`
}

type LeaveBalanceRequest struct {
	EmployeeID  string  `json:"employee"`
	Year        int     `json:"year"`
	AnnualLeave float64 `json:"annual,omitempty"`
	CarryOver   float64 `json:"carryover,omitempty"`
}

type EmployeeLeaveRequest struct {
	EmployeeID string    `json:"employee"`
	Code       string    `json:"code"`
	StartDate  time.Time `json:"startdate"`
	EndDate    time.Time `json:"enddate"`
}

type EmployeeLaborCodeRequest struct {
	EmployeeID   string `json:"employee"`
	ChargeNumber string `json:"chargeNumber"`
	Extension    string `json:"extension"`
}
