package services

import (
	"strings"

	"github.com/erneap/scheduler/schedulerApi/models/sites"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Every service will have functions for completing the CRUD functions
// the retrieve functions will be for individual site and the whole list of
// tea's sotes.

func CreateSite(teamid primitive.ObjectID, id, name string) *sites.Site {
	team, err := GetTeam(teamid)
	if err != nil {
		return nil
	}

	var answer *sites.Site

	for _, site := range team.Sites {
		if strings.EqualFold(site.ID, id) || strings.EqualFold(site.Name, name) {
			answer = &site
		}
	}
	if answer == nil {
		answer = &sites.Site{
			ID:   id,
			Name: name,
		}
		team.Sites = append(team.Sites, *answer)
		UpdateTeam(team)
	}
	return answer
}
