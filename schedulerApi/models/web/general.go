package web

import "github.com/golang-jwt/jwt"

type JWTClaim struct {
	UserID       string `json:"userid"`
	EmailAddress string `json:"emailAddress"`
	jwt.StandardClaims
}
