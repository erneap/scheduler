package web

type AuthenticationRequest struct {
	EmailAddress string `json:"emailAddress"`
	Password     string `json:"password"`
}

type UpdateRequest struct {
	ID    string `json:"id"`
	Field string `json:"field"`
	Value any    `json:"value"`
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

type ChangePasswordRequest struct {
	ID       string `json:"id"`
	Password string `json:"password"`
}

type Message struct {
	Message string `json:"message"`
}
