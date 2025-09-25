package controllers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/shemaIkuzwe/websocket/internal/auth"
	"github.com/shemaIkuzwe/websocket/internal/database"
	"github.com/shemaIkuzwe/websocket/internal/db"
	"golang.org/x/crypto/bcrypt"
)

type Payload struct {
	id             string
	email          string
	firstName      string
	lastName       string
	profilePicture string
}

func HandleLogin(ctx *gin.Context) {
	if ctx.Request.Method == http.MethodGet {
		oauthType := ctx.Request.FormValue("oauth")
		log.Println("oauth", oauthType)
		if oauthType != "" {
			switch oauthType {
			case "google":
				auth.HandleGoogleLogin(ctx)
			}
		}
		return
	}
	if ctx.Request.Method == http.MethodPost {
		CredentialLogin(ctx)
	}
}

func CredentialLogin(ctx *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := ctx.Bind(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Request",
		})
		return
	}
	user, err := db.Db.GetUserByEmail(ctx.Request.Context(), body.Email)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Username or Password",
		})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password.String), []byte(body.Password)); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Username or Password",
		})
		return
	}
	token, err := GenerateTOken(&user)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Failed to generate token",
		})
		return
	}
	ctx.SetSameSite(http.SameSiteLaxMode)
	ctx.SetCookie("auth_token", token, 3600*24, "/", "", false, true)
	ctx.JSON(http.StatusOK, gin.H{
		"message": "login successful",
	})
}
func SignUp(ctx *gin.Context) {
	var body struct {
		Email     string `json:"email" binding:"required,email"`
		FirstName string `json:"first_name" binding:"required,min=3"`
		LastName  string `json:"last_name" binding:"required,min=4"`
		Password  string `json:"password" binding:"required,min=4"`
	}
	if err := ctx.ShouldBind(&body); err != nil {
		log.Println("error", err)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Request api",
		})
		return
	}

	hashPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		log.Println("Failed to hash password")
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Request",
		})
		return
	}
	user, err := db.Db.CreateUser(ctx.Request.Context(), database.CreateUserParams{
		FirstName: body.FirstName,
		LastName:  body.LastName,
		Email:     body.Email,
		Password:  sql.NullString{String: string(hashPassword), Valid: true},
	})
	if err != nil {
		log.Println("Failed to create user", err)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Failed to create user",
		})
		return
	}

	token, err := GenerateTOken(&user)
	if err != nil {
		log.Println("Failed to generate token", err)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Failed to generate token",
		})
		return
	}
	ctx.SetSameSite(http.SameSiteLaxMode)
	ctx.SetCookie("auth_token", token, 3600*24, "/", "", false, true)
	ctx.JSON(http.StatusOK, gin.H{
		"message": user,
	})
}

func GenerateTOken(user *database.User) (string, error) {
	payload := Payload{
		id:             user.ID.String(),
		email:          user.Email,
		firstName:      user.FirstName,
		lastName:       user.LastName,
		profilePicture: user.ProfilePicture,
	}
	log.Println("Payload", payload.firstName, payload.profilePicture, payload.email, payload.lastName, payload.id)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":     user.ID.String(),
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
		"iat":     time.Now().Unix(),
		"payload": payload,
	})
	tokenString, err := token.SignedString([]byte(os.Getenv("AUTH_SECRET")))
	return tokenString, err
}

func VerifyToken(tokenString string) (any, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header)
		}
		return []byte(os.Getenv("AUTH_SECRET")), nil
	})
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token: %v", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid claims")
	}
	log.Println("claims", claims["exp"])
	if float64(time.Now().Unix()) > claims["exp"].(float64) {
		return nil, fmt.Errorf("token expired")
	}
	return claims["payload"], nil
}

func GetToken(c *gin.Context) (string, error) {
	tokenString, err := c.Cookie("auth_token")
	if err != nil {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			err := fmt.Errorf("invalid authHeader")
			return "", err
		}
		if !strings.HasPrefix(authHeader, "Bearer ") {
			err := fmt.Errorf("invalid authHeader")
			return "", err
		}
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	}
	return tokenString, nil
}
