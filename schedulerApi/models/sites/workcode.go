package sites

type Workcode struct {
	Id        string `json:"id" bson:"id"`
	Title     string `json:"title" bson:"title"`
	StartTime uint64 `json:"start" bson:"start"`
	IsLeave   bool   `json:"isLeave" bson:"isLeave"`
}
