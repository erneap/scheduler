package services

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"log"
	"os"

	"github.com/erneap/scheduler/schedulerApi/models/config"
	"github.com/erneap/scheduler/schedulerApi/models/sites"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Every service will have functions for completing the CRUD functions
// the retrieve functions will be for individual team and the whole list of
// teams.

// CRUD Create function
func CreateTeam(name string, useCodes bool) *sites.Team {
	teamCol := config.GetCollection(config.DB, "scheduler", "teams")

	filter := bson.M{
		"name": name,
	}

	var team *sites.Team

	teamCol.FindOne(context.TODO(), filter).Decode(team)
	if team == nil {
		team = &sites.Team{
			ID:   primitive.NewObjectID(),
			Name: name,
		}

		if useCodes {
			// get initial work codes from json file
			var initialTeam sites.Team
			jsonFile, err := os.Open("initial.json")
			if err != nil {
				log.Println(err)
			}

			log.Println("Opened Initial Data JSON File")
			defer jsonFile.Close()

			// read all the data of the jsonFile into a byteArray
			byteArray, err := ioutil.ReadAll(jsonFile)
			if err != nil {
				log.Println(err)
			}
			jsonString := string(byteArray)

			// unmarshall the json data into the team object
			err = json.Unmarshal([]byte(jsonString), &initialTeam)
			if err != nil {
				log.Println(err)
			}

			for _, wc := range initialTeam.Workcodes {
				nwc := sites.Workcode{
					Id:        wc.Id,
					Title:     wc.Title,
					StartTime: wc.StartTime,
					ShiftCode: wc.ShiftCode,
					IsLeave:   wc.IsLeave,
					TextColor: wc.TextColor,
					BackColor: wc.BackColor,
				}
				team.Workcodes = append(team.Workcodes, nwc)
			}
		}
		teamCol.InsertOne(context.TODO(), team)
	}
	return team
}

// CRUD Retrieve function single and multiple(All)
func GetTeam(id string) (*sites.Team, error) {
	teamid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	teamCol := config.GetCollection(config.DB, "scheduler", "teams")

	filter := bson.M{
		"_id": teamid,
	}

	var team sites.Team

	err = teamCol.FindOne(context.TODO(), filter).Decode(&team)
	if err != nil {
		return nil, err
	}
	return &team, nil
}

func GetTeams() ([]sites.Team, error) {
	teamCol := config.GetCollection(config.DB, "scheduler", "teams")

	var teams []sites.Team
	cursor, err := teamCol.Find(context.TODO(), bson.M{})
	if err != nil {
		return teams, err
	}

	err = cursor.All(context.TODO(), &teams)
	if err != nil {
		return teams, err
	}

	return teams, nil
}

// CRUD Update Function
func UpdateTeam(team *sites.Team) error {
	teamCol := config.GetCollection(config.DB, "scheduler", "teams")

	filter := bson.M{
		"_id": team.ID,
	}

	_, err := teamCol.ReplaceOne(context.TODO(), filter, team)

	return err
}

// CRUD Delete Function
func DeleteTeam(id primitive.ObjectID) error {
	teamCol := config.GetCollection(config.DB, "scheduler", "teams")

	filter := bson.M{
		"_id": id,
	}

	_, err := teamCol.DeleteOne(context.TODO(), filter)

	return err
}
