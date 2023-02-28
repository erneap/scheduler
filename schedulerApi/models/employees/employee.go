package employees

import (
	"errors"
	"fmt"
	"log"
	"sort"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Employee struct {
	ID     primitive.ObjectID `json:"id" bson:"_id"`
	TeamID primitive.ObjectID `json:"team" bson:"team"`
	SiteID string             `json:"site" bson:"site"`
	UserID primitive.ObjectID `json:"userid" bson:"userid"`
	Email  string             `json:"email" bson:"email"`
	Name   EmployeeName       `json:"name" bson:"name"`
	Data   EmployeeData       `json:"data" bson:"data"`
	Work   []Work             `json:"work,omitempty"`
}

type ByEmployees []Employee

func (c ByEmployees) Len() int { return len(c) }
func (c ByEmployees) Less(i, j int) bool {
	if c[i].Name.LastName == c[j].Name.LastName {
		if c[i].Name.FirstName == c[j].Name.FirstName {
			return c[i].Name.MiddleName < c[j].Name.MiddleName
		}
		return c[i].Name.FirstName < c[j].Name.FirstName
	}
	return c[i].Name.LastName < c[j].Name.LastName
}
func (c ByEmployees) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

func (e *Employee) RemoveLeaves(start, end time.Time) {
	sort.Sort(ByLeaveDay(e.Data.Leaves))
	startpos := -1
	endpos := -1
	for i, lv := range e.Data.Leaves {
		if startpos < 0 && (lv.LeaveDate.Equal(start) || lv.LeaveDate.After(start)) &&
			(lv.LeaveDate.Equal(end) || lv.LeaveDate.Before(end)) {
			startpos = i
		} else if startpos >= 0 && (lv.LeaveDate.Equal(start) || lv.LeaveDate.After(start)) &&
			(lv.LeaveDate.Equal(end) || lv.LeaveDate.Before(end)) {
			endpos = i
		}
	}
	if startpos >= 0 {
		if endpos < 0 {
			endpos = startpos
		}
		e.Data.Leaves = append(e.Data.Leaves[:startpos], e.Data.Leaves[endpos+1:]...)
	}
}

type EmployeeName struct {
	FirstName  string `json:"first"`
	MiddleName string `json:"middle"`
	LastName   string `json:"last"`
	Suffix     string `json:"suffix"`
}

type EmployeeData struct {
	CompanyInfo CompanyInfo         `json:"companyinfo"`
	Assignments []Assignment        `json:"assignments,omitempty"`
	Variations  []Variation         `json:"variations,omitempty"`
	Balances    []AnnualLeave       `json:"balance,omitempty"`
	Leaves      []LeaveDay          `json:"leaves,omitempty"`
	Requests    []LeaveRequest      `json:"requests,omitempty"`
	LaborCodes  []EmployeeLaborCode `json:"laborCodes,omitempty"`
}

func (e *Employee) IsAssigned(site, workcenter string, start, end time.Time) bool {
	answer := false
	for _, asgmt := range e.Data.Assignments {
		if strings.EqualFold(asgmt.Site, site) &&
			strings.EqualFold(asgmt.Workcenter, workcenter) &&
			asgmt.StartDate.After(end) && asgmt.EndDate.Before((start)) {
			answer = true
		}
	}
	return answer
}

func (e *Employee) AtSite(site string, start, end time.Time) bool {
	answer := false
	for _, asgmt := range e.Data.Assignments {
		if strings.EqualFold(asgmt.Site, site) &&
			asgmt.StartDate.After(end) && asgmt.EndDate.Before((start)) {
			answer = true
		}
	}
	return answer
}

func (e *Employee) GetWorkday(date time.Time, offset float64) *Workday {
	var wkday *Workday = nil
	var siteid string = ""
	for _, asgmt := range e.Data.Assignments {
		if (asgmt.StartDate.Before(date) || asgmt.StartDate.Equal(date)) &&
			(asgmt.EndDate.After(date) || asgmt.EndDate.Equal(date)) {
			siteid = asgmt.Site
			wkday = asgmt.GetWorkday(date, offset)
		}
	}
	for _, vari := range e.Data.Variations {
		if (vari.StartDate.Before(date) || vari.StartDate.Equal(date)) &&
			(vari.EndDate.After(date) || vari.EndDate.Equal(date)) {
			wkday = vari.GetWorkday(siteid, date)
		}
	}
	return wkday
}

func (e *Employee) GetStandardWorkday(date time.Time) float64 {
	answer := 8.0
	count := 0
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0,
		time.UTC)
	end := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	for start.Weekday() != time.Sunday {
		start = start.AddDate(0, 0, -1)
	}
	for end.Weekday() != time.Saturday {
		end = end.AddDate(0, 0, 1)
	}
	for start.Before(end) || start.Equal(end) {
		wd := e.GetWorkday(start, 0.0)
		if wd.Code != "" {
			count++
		}
		start = start.AddDate(0, 0, 1)
	}
	if count < 5 {
		answer = 10.0
	}
	return answer
}

func (e *Employee) AddAssignment(site, wkctr string, start time.Time) {
	// get next assignment id as one plus the highest in employee data
	max := 0
	for _, asgmt := range e.Data.Assignments {
		if int(asgmt.ID) > max {
			max = int(asgmt.ID)
		}
	}

	// set the current highest or last end date to one day before
	// this assignment start date
	sort.Sort(ByAssignment(e.Data.Assignments))
	lastAsgmt := e.Data.Assignments[len(e.Data.Assignments)-1]
	lastAsgmt.EndDate = start.AddDate(0, 0, -1)
	e.Data.Assignments[len(e.Data.Assignments)-1] = lastAsgmt

	// create the new assignment
	newAsgmt := Assignment{
		ID:           uint(max + 1),
		Site:         site,
		Workcenter:   wkctr,
		StartDate:    start,
		EndDate:      time.Date(9999, 12, 30, 0, 0, 0, 0, time.UTC),
		RotationDate: time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC),
		RotationDays: 0,
	}
	// add a single schedule, plus it's seven workdays, set schedule
	// automatically to M-F/workcenter/8 hours/day shift.
	newAsgmt.AddSchedule(7)
	for i, wd := range newAsgmt.Schedules[0].Workdays {
		if i != 0 && i != 6 {
			wd.Code = "D"
			wd.Workcenter = wkctr
			wd.Hours = 8.0
			newAsgmt.Schedules[0].Workdays[i] = wd
		}
	}

	// add it employees assignment list and sort them
	e.Data.Assignments = append(e.Data.Assignments, newAsgmt)
	sort.Sort(ByAssignment(e.Data.Assignments))
}

func (e *Employee) RemoveAssignment(id uint) {
	pos := -1
	if id > 1 {
		for i, asgmt := range e.Data.Assignments {
			if asgmt.ID == id {
				pos = i
			}
		}
		if pos >= 0 {
			e.Data.Assignments = append(e.Data.Assignments[:pos],
				e.Data.Assignments[pos+1:]...)
		}
	}
}

func (e *Employee) PurgeOldData(date time.Time) {
	// purge old assignments based on assignment end date
	sort.Sort(ByAssignment(e.Data.Assignments))
	for i := len(e.Data.Assignments) - 1; i >= 0; i-- {
		if e.Data.Assignments[i].EndDate.Before(date) {
			e.Data.Assignments = append(e.Data.Assignments[:i],
				e.Data.Assignments[i+1:]...)
		}
	}
	// purge old variations based on variation end date
	sort.Sort(ByVariation(e.Data.Variations))
	for i := len(e.Data.Variations) - 1; i >= 0; i-- {
		if e.Data.Variations[i].EndDate.Before(date) {
			e.Data.Variations = append(e.Data.Variations[:i],
				e.Data.Variations[i+1:]...)
		}
	}
}

func (e *Employee) UpdateAnnualLeave(year int, annual, carry float64) {
	found := false
	for _, al := range e.Data.Balances {
		if al.Year == year {
			found = true
			al.Annual = annual
			al.Carryover = carry
		}
	}
	if !found {
		al := AnnualLeave{
			Year:      year,
			Annual:    annual,
			Carryover: carry,
		}
		e.Data.Balances = append(e.Data.Balances, al)
		sort.Sort(ByBalance(e.Data.Balances))
	}
}

func (e *Employee) UpdateLeave(date time.Time, code, status string,
	hours float64, requestID *primitive.ObjectID) {
	found := false
	for _, lv := range e.Data.Leaves {
		if lv.LeaveDate.Equal(date) {
			found = true
			lv.Code = code
			lv.Status = status
			lv.Hours = hours
			if requestID != nil {
				lv.RequestID = requestID.Hex()
			}
		}
	}
	if !found {
		lv := LeaveDay{
			LeaveDate: date,
			Code:      code,
			Hours:     hours,
			Status:    status,
			RequestID: requestID.Hex(),
		}
		e.Data.Leaves = append(e.Data.Leaves, lv)
		sort.Sort(ByLeaveDay(e.Data.Leaves))
	}
}

func (e *Employee) NewLeaveRequest(empID, code string, start, end time.Time,
	offset float64) {
	lr := LeaveRequest{
		ID:          primitive.NewObjectID().Hex(),
		EmployeeID:  empID,
		RequestDate: time.Now().UTC(),
		PrimaryCode: code,
		StartDate:   start,
		EndDate:     end,
		Status:      "REQUESTED",
	}
	zoneID := "UTC"
	if offset > 0 {
		zoneID += "+" + fmt.Sprintf("%0.1f", offset)
	} else if offset < 0 {
		zoneID += fmt.Sprintf("%0.1f", offset)
	}
	timeZone := time.FixedZone(zoneID, int(offset*60*60))
	sDate := time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0,
		timeZone)
	std := e.GetStandardWorkday(sDate)
	for sDate.Before(end) || sDate.Equal(end) {
		wd := e.GetWorkday(sDate, offset)
		if wd.Code != "" {
			hours := wd.Hours
			if hours == 0.0 {
				hours = std
			}
			if code == "H" {
				hours = 8.0
			}
			lv := LeaveDay{
				LeaveDate: sDate,
				Code:      code,
				Hours:     hours,
				Status:    "REQUESTED",
				RequestID: lr.ID,
			}
			lr.RequestedDays = append(lr.RequestedDays, lv)
		}
		sDate = sDate.AddDate(0, 0, 1)
	}
	e.Data.Requests = append(e.Data.Requests, lr)
	sort.Sort(ByLeaveRequest(e.Data.Requests))
}

func (e *Employee) UpdateLeaveRequest(request, field, value string,
	offset float64) error {
	for i, req := range e.Data.Requests {
		if req.ID == request {
			switch strings.ToLower(field) {
			case "startdate", "start":
				lvDate, err := time.Parse("2006-01-02", value)
				if err != nil {
					return err
				}
				req.StartDate = lvDate
				req.Status = "REQUESTED"
				// reset the leave dates
				req.SetLeaveDays(e, offset)
			case "enddate", "end":
				lvDate, err := time.Parse("2006-01-02", value)
				if err != nil {
					return err
				}
				req.EndDate = lvDate
				req.Status = "REQUESTED"
				// reset the leave dates
				req.SetLeaveDays(e, offset)
			case "code", "primarycode":
				req.PrimaryCode = value
				log.Println(req.PrimaryCode)
			case "dates":
				parts := strings.Split(value, "|")
				start, err := time.ParseInLocation("2006-01-02", parts[0], time.UTC)
				if err != nil {
					return err
				}
				end, err := time.ParseInLocation("2006-01-02", parts[1], time.UTC)
				if err != nil {
					return nil
				}
				req.StartDate = time.Date(start.Year(), start.Month(), start.Day(), 0,
					0, 0, 0, time.Local)
				req.EndDate = time.Date(end.Year(), end.Month(), end.Day(), 0, 0, 0, 0,
					time.Local)
				req.SetLeaveDays(e, offset)
			case "approve":
				req.ApprovedBy = value
				req.ApprovalDate = time.Now().UTC()
				req.Status = "APPROVED"
				var deletes []int
				for _, rLv := range req.RequestedDays {
					found := false
					for j, lv := range e.Data.Leaves {
						if lv.LeaveDate.Equal(rLv.LeaveDate) {
							found = true
							if rLv.Code != "" && !found {
								if lv.Status != "ACTUAL" {
									lv.Code = rLv.Code
									lv.Hours = rLv.Hours
									lv.Status = "APPROVED"
									lv.RequestID = rLv.RequestID
									e.Data.Leaves[j] = lv
								}
								if !found {
									rLv.Status = "APPROVED"
									e.Data.Leaves = append(e.Data.Leaves, rLv)
									if strings.ToLower(rLv.Code) == "h" && rLv.Hours == 8.0 {
										std := e.GetStandardWorkday(rLv.LeaveDate)
										if std > rLv.Hours {
											lv := LeaveDay{
												LeaveDate: rLv.LeaveDate,
												Code:      "V",
												Hours:     std - rLv.Hours,
												Status:    "APPROVED",
												RequestID: req.ID,
											}
											e.Data.Leaves = append(e.Data.Leaves, lv)
										}
									}
								}
							} else if !found {
								deletes = append(deletes, j)
							}
						}
					}
				}
				if len(deletes) > 0 {
					for i := len(deletes) - 1; i >= 0; i-- {
						e.Data.Leaves = append(e.Data.Leaves[:deletes[i]],
							e.Data.Leaves[deletes[i]-1:]...)
					}
				}
				sort.Sort(ByLeaveDay(e.Data.Leaves))
			case "day", "requestday":
				fmt.Println(value)
				parts := strings.Split(value, "|")
				lvDate, _ := time.Parse("2006-01-02", parts[0])
				code := parts[1]
				hours, _ := strconv.ParseFloat(parts[2], 64)
				found := false
				for j, lv := range req.RequestedDays {
					if lv.LeaveDate.Equal(lvDate) {
						found = true
						lv.Code = code
						if code == "" {
							lv.Hours = 0.0
						} else {
							lv.Hours = hours
						}
						req.RequestedDays[j] = lv
					}
				}
				req.Status = "REQUESTED"
				if !found {
					lv := LeaveDay{
						LeaveDate: lvDate,
						Code:      code,
						Hours:     hours,
						Status:    "REQUESTED",
						RequestID: req.ID,
					}
					req.RequestedDays = append(req.RequestedDays, lv)
				}
			}
			e.Data.Requests[i] = req
		}
	}
	return nil
}

func (e *Employee) DeleteLeaveRequest(request string) error {
	pos := -1
	for i, req := range e.Data.Requests {
		if req.ID == request {
			pos = i
		}
	}
	if pos < 0 {
		return errors.New("request not found")
	}
	e.Data.Requests = append(e.Data.Requests[:pos], e.Data.Requests[pos+1:]...)
	// delete all leaves associated with this leave request, except if the leave
	// has a status of actual
	sort.Sort(ByLeaveDay(e.Data.Leaves))
	var deletes []int
	for i, lv := range e.Data.Leaves {
		if lv.RequestID == request && strings.ToLower(lv.Status) != "actual" {
			deletes = append(deletes, i)
		}
	}
	if len(deletes) > 0 {
		for i := len(deletes) - 1; i >= 0; i-- {
			e.Data.Leaves = append(e.Data.Leaves[:deletes[i]],
				e.Data.Leaves[deletes[i]+1:]...)
		}
	}
	return nil
}

func (e *Employee) HasLaborCode(chargeNumber, extension string) bool {
	found := false
	for _, lc := range e.Data.LaborCodes {
		if lc.ChargeNumber == chargeNumber && lc.Extension == extension {
			found = true
		}
	}
	return found
}

func (e *Employee) AddLaborCode(chargeNo, ext string) {
	if !e.HasLaborCode(chargeNo, ext) {
		lc := EmployeeLaborCode{
			ChargeNumber: chargeNo,
			Extension:    ext,
		}
		e.Data.LaborCodes = append(e.Data.LaborCodes, lc)
	}
}

func (e *Employee) DeleteLaborCode(chargeNo, ext string) {
	if e.HasLaborCode(chargeNo, ext) {
		pos := -1
		for i, lc := range e.Data.LaborCodes {
			if lc.ChargeNumber == chargeNo && lc.Extension == ext {
				pos = i
			}
		}
		if pos >= 0 {
			e.Data.LaborCodes = append(e.Data.LaborCodes[:pos],
				e.Data.LaborCodes[pos+1:]...)
		}
	}
}
