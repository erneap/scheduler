package web

import (
	"log"
	"strconv"
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

type CreateUserAccount struct {
	ID           string `json:"id"`
	EmailAddress string `json:"emailAddress"`
	LastName     string `json:"lastName"`
	FirstName    string `json:"firstName"`
	MiddleName   string `json:"middleName"`
	Password     string `json:"password"`
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
	Value        string `json:"value"`
}

func (ur *ChangeAssignmentRequest) StringValue() string {
	return ur.Value
}

func (ur *ChangeAssignmentRequest) NumberValue() uint {
	val, err := strconv.ParseUint(ur.Value, 10, 32)
	if err != nil {
		log.Println(err.Error())
	}
	return uint(val)
}

func (ur *ChangeAssignmentRequest) IntValue() int {
	val, err := strconv.ParseInt(ur.Value, 10, 32)
	if err != nil {
		log.Println(err.Error())
	}
	return int(val)
}

func (ur *ChangeAssignmentRequest) FloatValue() float64 {
	val, err := strconv.ParseFloat(ur.Value, 64)
	if err != nil {
		log.Println(err.Error())
	}
	return val
}

func (ur *ChangeAssignmentRequest) BooleanValue() bool {
	val, err := strconv.ParseBool(ur.Value)
	if err != nil {
		log.Println(err.Error())
	}
	return val
}

func (ur *ChangeAssignmentRequest) DateValue() time.Time {
	dateValue, err := time.ParseInLocation("2006-01-02",
		ur.Value, time.UTC)
	if err != nil {
		log.Println(err.Error())
	}
	return dateValue
}

type NewEmployeeVariation struct {
	EmployeeID string              `json:"employee"`
	Variation  employees.Variation `json:"variation"`
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

type EmployeeLeaveDayRequest struct {
	EmployeeID string             `json:"employee"`
	Leave      employees.LeaveDay `json:"leave"`
}
