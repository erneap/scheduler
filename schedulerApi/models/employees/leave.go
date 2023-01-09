package employees

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AnnualLeave struct {
	Year      int     `json:"year" bson:"year"`
	Annual    float64 `json:"annual" bson:"annual"`
	Carryover float64 `json:"carryover" bson:"carryover"`
}

type LeaveDay struct {
	LeaveDate time.Time          `json:"leavedate" bson:"leavedate"`
	Code      string             `json:"code" bson:"code"`
	Hours     float64            `json:"hours" bson:"hours"`
	Status    string             `json:"status" bson:"status"`
	RequestID primitive.ObjectID `json:"requestid" bson:"requestid"`
}

type ByLeaveDay []LeaveDay

func (c ByLeaveDay) Len() int { return len(c) }
func (c ByLeaveDay) Less(i, j int) bool {
	return c[i].LeaveDate.Before(c[j].LeaveDate)
}
func (c ByLeaveDay) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

type LeaveRequest struct {
	ID            primitive.ObjectID `json:"id" bson:"id"`
	RequestDate   time.Time          `json:"requestDate" bson:"requestDate"`
	PrimaryCode   string             `json:"primarycode" bson:"primarycode"`
	StartDate     time.Time          `json:"startdate" bson:"startdate"`
	EndDate       time.Time          `json:"enddate" bson:"enddate"`
	Status        string             `json:"status" bson:"status"`
	ApprovedBy    primitive.ObjectID `json:"approvedby" bson:"approvedby"`
	ApprovalDate  time.Time          `json:"approvalDate" bson:"approvalDate"`
	RequestedDays []LeaveDay         `json:"requesteddays" bson:"requesteddays"`
}

type ByLeaveRequest []LeaveRequest

func (c ByLeaveRequest) Len() int { return len(c) }
func (c ByLeaveRequest) Less(i, j int) bool {
	if c[i].StartDate.Equal(c[j].StartDate) {
		if c[i].EndDate.Equal(c[j].EndDate) {
			return c[i].ID.Timestamp().Before(c[j].ID.Timestamp())
		}
		return c[i].EndDate.Before(c[j].EndDate)
	}
	return c[i].StartDate.Before(c[j].StartDate)
}
func (c ByLeaveRequest) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

func (lr *LeaveRequest) SetLeaveDay(date time.Time, code string, hours float64) {
	for _, lv := range lr.RequestedDays {
		if lv.LeaveDate.Equal(date) {
			lv.Code = code
			lv.Hours = hours
		}
	}
}

type ByBalance []AnnualLeave

func (c ByBalance) Len() int { return len(c) }
func (c ByBalance) Less(i, j int) bool {
	return c[i].Year < c[j].Year
}
func (c ByBalance) Swap(i, j int) { c[i], c[j] = c[j], c[i] }
