package web

type NewSiteRequest struct {
	TeamID string `json:"team"`
	SiteID string `json:"siteid"`
	Name   string `json:"name"`
}

type NewSiteWorkcenter struct {
	TeamID  string `json:"team"`
	SiteID  string `json:"siteid"`
	WkctrID string `json:"wkctrid"`
	Name    string `json:"name"`
}

type SiteWorkcenterUpdate struct {
	TeamID  string `json:"team"`
	SiteID  string `json:"siteid"`
	WkctrID string `json:"wkctrid"`
	Field   string `json:"field"`
	Value   string `json:"value"`
}
