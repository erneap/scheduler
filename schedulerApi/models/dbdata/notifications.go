package dbdata

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NotificationMessage struct {
	ID      primitive.ObjectID  `json:"id" bson:"_id"`
	Date    time.Time           `json:"date" bson:"date"`
	To      string              `json:"to" bson:"to"`
	From    string              `json:"from" bson:"from"`
	Message string              `json:"message" bson:"bson"`
	Checked []NotificationCheck `json:"checks,omitempty" bson:"checks,omitempty"`
}

type ByNoficationMessage []NotificationMessage

func (c ByNoficationMessage) Len() int { return len(c) }
func (c ByNoficationMessage) Less(i, j int) bool {
	return c[i].Date.Before(c[j].Date)
}
func (c ByNoficationMessage) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

type NotificationCheck struct {
	ID string `json:"id" bson:"id"`
}
