package employees

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"errors"
	"io"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Employee struct {
	ID            primitive.ObjectID `json:"id" bson:"_id"`
	TeamID        primitive.ObjectID `json:"team" bson:"team"`
	SiteID        string             `json:"site" bson:"site"`
	UserID        primitive.ObjectID `json:"userid" bson:"userid"`
	Name          EmployeeName       `json:"name" bson:"name"`
	EncryptedData string             `json:"_" bson:"encrypted"`
	Data          EmployeeData       `json:"data" bson:"-"`
	Work          []Work             `json:"work,omitempty"`
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

func (e *Employee) Encrypt() error {
	// remove work data before encryption
	data, err := json.Marshal(e.Data)
	if err != nil {
		return err
	}

	// get the security key from the environment and create a byte array from
	// it for the cipher
	keyString := os.Getenv("SECURITY_KEY")
	key := []byte(keyString)

	// create the aes cipher using our security key
	c, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	// create the GCM for the symetric key
	gcm, err := cipher.NewGCM(c)
	if err != nil {
		return err
	}

	// create a new byte array to hold the nonce which must be passed to create
	// the encrypted value.
	nonce := make([]byte, gcm.NonceSize())
	// and populate it with a random code
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return err
	}

	// lastly, encrypt the value and store in problem property above
	e.EncryptedData = string(gcm.Seal(nonce, nonce, data, nil))

	return nil
}

func (e *Employee) Decrypt() error {
	prob := []byte(e.EncryptedData)
	if len(prob) == 0 {
		return errors.New("no encrypted employee data")
	}
	// get the security key from the environment and create a byte array from
	// it for the cipher
	keyString := os.Getenv("SECURITY_KEY")
	key := []byte(keyString)

	// create the aes cipher using our security key
	c, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	// create the GCM for the symetric key
	gcm, err := cipher.NewGCM(c)
	if err != nil {
		return err
	}

	nonceSize := gcm.NonceSize()
	if len(prob) < nonceSize {
		return errors.New("encrypted data too small")
	}

	nonce, prob := prob[:nonceSize], prob[nonceSize:]
	plainText, err := gcm.Open(nil, nonce, prob, nil)
	if err != nil {
		return err
	}
	json.Unmarshal(plainText, &e.Data)
	return nil
}

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

func (e *EmployeeData) IsAssigned(site, workcenter string, start, end time.Time) bool {
	answer := false
	for _, asgmt := range e.Assignments {
		if strings.EqualFold(asgmt.Site, site) &&
			strings.EqualFold(asgmt.Workcenter, workcenter) &&
			asgmt.StartDate.After(end) && asgmt.EndDate.Before((start)) {
			answer = true
		}
	}
	return answer
}

func (e *EmployeeData) AtSite(site string, start, end time.Time) bool {
	answer := false
	for _, asgmt := range e.Assignments {
		if strings.EqualFold(asgmt.Site, site) &&
			asgmt.StartDate.After(end) && asgmt.EndDate.Before((start)) {
			answer = true
		}
	}
	return answer
}

func (e *EmployeeData) GetWorkday(date time.Time) *Workday {
	var wkday *Workday = nil
	var siteid string = ""
	for _, asgmt := range e.Assignments {
		if (asgmt.StartDate.Before(date) || asgmt.StartDate.Equal(date)) &&
			(asgmt.EndDate.After(date) || asgmt.EndDate.Equal(date)) {
			siteid = asgmt.Site
			wkday = asgmt.GetWorkday(asgmt.Site, date)
		}
	}
	for _, vari := range e.Variations {
		if (vari.StartDate.Before(date) || vari.StartDate.Equal(date)) &&
			(vari.EndDate.After(date) || vari.EndDate.Equal(date)) {
			wkday = vari.GetWorkday(siteid, date)
		}
	}
	return wkday
}

func (e *EmployeeData) RemoveAssignment(id uint) {
	pos := -1
	for i, asgmt := range e.Assignments {
		if asgmt.ID == id {
			pos = i
		}
	}
	if pos >= 0 {
		e.Assignments = append(e.Assignments[:pos], e.Assignments[pos+1:]...)
	}
}

func (e *EmployeeData) PurgeOldData(date time.Time) {
	// purge old assignments based on assignment end date
	sort.Sort(ByAssignment(e.Assignments))
	for i := len(e.Assignments) - 1; i >= 0; i-- {
		if e.Assignments[i].EndDate.Before(date) {
			e.Assignments = append(e.Assignments[:i], e.Assignments[i+1:]...)
		}
	}
	// purge old variations based on variation end date
	sort.Sort(ByVariation(e.Variations))
	for i := len(e.Variations) - 1; i >= 0; i-- {
		if e.Variations[i].EndDate.Before(date) {
			e.Variations = append(e.Variations[:i], e.Variations[i+1:]...)
		}
	}
}

func (e *EmployeeData) UpdateAnnualLeave(year int, annual, carry float64) {
	found := false
	for _, al := range e.Balances {
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
		e.Balances = append(e.Balances, al)
		sort.Sort(ByBalance(e.Balances))
	}
}

func (e *EmployeeData) UpdateLeave(date time.Time, code, status string,
	hours float64, requestID *primitive.ObjectID) {
	found := false
	for _, lv := range e.Leaves {
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
		e.Leaves = append(e.Leaves, lv)
		sort.Sort(ByLeaveDay(e.Leaves))
	}
}

func (e *EmployeeData) NewLeaveRequest(empID, code string, start, end time.Time) {
	lr := LeaveRequest{
		ID:          primitive.NewObjectID().Hex(),
		EmployeeID:  empID,
		RequestDate: time.Now().UTC(),
		PrimaryCode: code,
		StartDate:   start,
		EndDate:     end,
		Status:      "REQUESTED",
	}
	sDate := time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0,
		time.UTC)
	for sDate.Before(end) || sDate.Equal(end) {
		wd := e.GetWorkday(sDate)
		if wd.Code != "" {
			hours := wd.Hours
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
	e.Requests = append(e.Requests, lr)
	sort.Sort(ByLeaveRequest(e.Requests))
}

func (e *EmployeeData) UpdateLeaveRequest(request, field, value string) error {
	for i, req := range e.Requests {
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
				req.SetLeaveDays(e)
			case "enddate", "end":
				lvDate, err := time.Parse("2006-01-02", value)
				if err != nil {
					return err
				}
				req.EndDate = lvDate
				req.Status = "REQUESTED"
				// reset the leave dates
				req.SetLeaveDays(e)
			case "approve":
				req.ApprovedBy = value
				req.ApprovalDate = time.Now().UTC()
				req.Status = "APPROVED"
				for _, rLv := range req.RequestedDays {
					found := false
					for j, lv := range e.Leaves {
						if lv.LeaveDate.Equal(rLv.LeaveDate) {
							found = true
							if lv.Status != "ACTUAL" {
								lv.Code = rLv.Code
								lv.Hours = rLv.Hours
								lv.Status = "APPROVED"
								lv.RequestID = rLv.RequestID
								e.Leaves[j] = lv
							}
							if !found {
								rLv.Status = "APPROVED"
								e.Leaves = append(e.Leaves, rLv)
							}
						}
					}
				}
			case "day", "requestday":
				parts := strings.Split(value, "|")
				lvDate, _ := time.Parse("2006-01-02", parts[0])
				code := parts[1]
				hours, _ := strconv.ParseFloat(parts[2], 64)
				found := false
				for j, lv := range req.RequestedDays {
					if lv.LeaveDate.Equal(lvDate) {
						found = true
						lv.Code = code
						lv.Hours = hours
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
			e.Requests[i] = req
		}
	}
	return nil
}

func (e *EmployeeData) DeleteLeaveRequest(request string) error {
	pos := -1
	for i, req := range e.Requests {
		if req.ID == request {
			pos = i
		}
	}
	if pos < 0 {
		return errors.New("request not found")
	}
	e.Requests = append(e.Requests[:pos], e.Requests[pos+1:]...)
	return nil
}

func (e *EmployeeData) HasLaborCode(chargeNumber, extension string) bool {
	found := false
	for _, lc := range e.LaborCodes {
		if lc.ChargeNumber == chargeNumber && lc.Extension == extension {
			found = true
		}
	}
	return found
}

func (e *EmployeeData) AddLaborCode(chargeNo, ext string) {
	if !e.HasLaborCode(chargeNo, ext) {
		lc := EmployeeLaborCode{
			ChargeNumber: chargeNo,
			Extension:    ext,
		}
		e.LaborCodes = append(e.LaborCodes, lc)
	}
}

func (e *EmployeeData) DeleteLaborCode(chargeNo, ext string) {
	if e.HasLaborCode(chargeNo, ext) {
		pos := -1
		for i, lc := range e.LaborCodes {
			if lc.ChargeNumber == chargeNo && lc.Extension == ext {
				pos = i
			}
		}
		if pos >= 0 {
			e.LaborCodes = append(e.LaborCodes[:pos], e.LaborCodes[pos+1:]...)
		}
	}
}
