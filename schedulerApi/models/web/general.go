package web

import "github.com/golang-jwt/jwt"

type JWTClaim struct {
	UserID       string `json:"userid"`
	EmailAddress string `json:"emailAddress"`
	jwt.StandardClaims
}

type MessageRequest struct {
	To      string `json:"to"`
	From    string `json:"from"`
	Message string `json:"message"`
}

type NotificationAck struct {
	Messages []string `json:"messages"`
}
