package middleware

import (
	"errors"
	"net/http"
	"os"
	"time"

	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateToken(userid primitive.ObjectID, email string) (string, error) {
	key := []byte(os.Getenv("JWT_SECRET"))
	expireTime := time.Now().Add(6 * time.Hour)
	claims := &web.JWTClaim{
		UserID:       userid.Hex(),
		EmailAddress: email,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expireTime.Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(key)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func ValidateToken(signedToken string) (*web.JWTClaim, error) {
	token, err := jwt.ParseWithClaims(
		signedToken,
		&web.JWTClaim{},
		func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		},
	)
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*web.JWTClaim)
	if !ok {
		return nil, errors.New("couldn't parse claims")
	}
	if claims.ExpiresAt < time.Now().Local().Unix() {
		return nil, errors.New("token expired")
	}
	return claims, nil
}

func CheckJWT() gin.HandlerFunc {
	return func(context *gin.Context) {
		tokenString := context.GetHeader("Authorization")
		if tokenString == "" {
			context.JSON(http.StatusUnauthorized, gin.H{"error": "request does not contain an access token"})
			context.Abort()
			return
		}
		claims, err := ValidateToken(tokenString)
		if err != nil {
			context.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			context.Abort()
			return
		}

		// replace token by passing a new token in the response header
		id, _ := primitive.ObjectIDFromHex(claims.UserID)
		tokenString, _ = CreateToken(id, claims.EmailAddress)
		context.Writer.Header().Set("Token", tokenString)
		context.Next()
	}
}

func CheckRole(prog, role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "request does not contain an access token"})
			c.Abort()
			return
		}
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
			return
		}
		userID, err := primitive.ObjectIDFromHex(claims.UserID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user identifer incorrect: " + err.Error()})
			c.Abort()
			return
		}
		user := services.GetUser(userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found: " + err.Error()})
			c.Abort()
			return
		}
		if !user.IsInGroup(prog, role) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not in group"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func CheckRoles(prog string, roles []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "request does not contain an access token"})
			c.Abort()
			return
		}
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
			return
		}
		userID, err := primitive.ObjectIDFromHex(claims.UserID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user identifer incorrect: " + err.Error()})
			c.Abort()
			return
		}
		user := services.GetUser(userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found: " + err.Error()})
			c.Abort()
			return
		}
		inRole := false
		for i := 0; i < len(roles) && !inRole; i++ {
			if user.IsInGroup(prog, roles[i]) {
				inRole = true
			}
		}
		if !inRole {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not in group"})
			c.Abort()
			return
		}
		c.Next()
	}
}
