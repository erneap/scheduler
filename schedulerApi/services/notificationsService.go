package services

import (
	"context"
	"errors"
	"sort"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/config"
	"github.com/erneap/scheduler/schedulerApi/models/dbdata"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// notification retrieve functions (All, by Employee, and single)

func GetAllMessages() ([]dbdata.Notification, error) {
	noteCol := config.GetCollection(config.DB, "scheduler", "notifications")

	var list []dbdata.Notification

	cursor, err := noteCol.Find(context.TODO(), bson.M{})
	if err != nil {
		return list, err
	}

	if err = cursor.All(context.TODO(), &list); err != nil {
		return list, err
	}

	sort.Sort(dbdata.ByNofication(list))

	return list, nil
}

func GetMessagesByEmployee(id string) ([]dbdata.Notification, error) {
	noteCol := config.GetCollection(config.DB, "scheduler", "notifications")

	var list []dbdata.Notification

	filter := bson.M{
		"to": id,
	}

	cursor, err := noteCol.Find(context.TODO(), filter)
	if err != nil {
		return list, err
	}

	if err = cursor.All(context.TODO(), &list); err != nil {
		return list, err
	}

	sort.Sort(dbdata.ByNofication(list))

	return list, nil
}

func GetMessage(id string) (dbdata.Notification, error) {
	noteCol := config.GetCollection(config.DB, "scheduler", "notifications")

	var answer dbdata.Notification
	mid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return answer, err
	}

	filter := bson.M{
		"_id": mid,
	}

	err = noteCol.FindOne(context.TODO(), filter).Decode(&answer)
	if err != nil {
		return answer, err
	}

	return answer, nil
}

// Create function which include receipent, sender and message.
// the identifier and date are automatic.
func CreateMessage(to, from, message string) (*dbdata.Notification, error) {
	noteCol := config.GetCollection(config.DB, "scheduler", "notifications")

	msg := &dbdata.Notification{
		ID:      primitive.NewObjectID(),
		Date:    time.Now().UTC(),
		To:      to,
		From:    from,
		Message: message,
	}

	result, err := noteCol.InsertOne(context.TODO(), msg)
	if err != nil {
		return nil, err
	}
	if result.InsertedID == primitive.NilObjectID {
		return nil, errors.New("Not Created")
	}
	return msg, nil
}

// There is no update routine because messages can't be updated manually.

// After the message is viewed, it will be acknowledged and removed
// from the database.  This is the only delete routine.
func DeleteMessage(id string) error {
	noteCol := config.GetCollection(config.DB, "scheduler", "notifications")

	mid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	filter := bson.M{
		"_id": mid,
	}

	result, err := noteCol.DeleteOne(context.TODO(), filter)
	if err != nil {
		return err
	}

	if result.DeletedCount <= 0 {
		return errors.New("No message deleted!")
	}

	return nil
}
