package controllers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/mitchellh/mapstructure"

	"github.com/shemaIkuzwe/websocket/internal/database"
	"github.com/shemaIkuzwe/websocket/internal/db"
	"golang.org/x/crypto/bcrypt"
)

type Payload struct {
	Id             string `json:"id"`
	Email          string `json:"email"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	ProfilePicture string `json:"profile_picture"`
}

type SessionStatus string

const (
	un_authenticated SessionStatus = "un_authenticated"
	authenticated    SessionStatus = "authenticated"
)

func HandleLogin(ctx *gin.Context) {
	if ctx.Request.Method == http.MethodGet {
		oauthType := ctx.Request.FormValue("oauth")
		log.Println("oauth", oauthType)
		if oauthType != "" {
			switch oauthType {
			case "google":
				HandleGoogleLogin(ctx)
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
	if err := bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(body.Password)); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Username or Password",
		})
		return
	}
	token, err := GenerateToken(&user)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Failed to generate token",
		})
		return
	}
	ctx.SetSameSite(http.SameSiteLaxMode)
	ctx.SetCookie("auth_token", token, 3600*24, "/", "", false, true)
	ctx.JSON(http.StatusOK, gin.H{
		"message": "user logged in",
	})
}
func SignUp(ctx *gin.Context) {
	var body struct {
		Email     string `json:"email"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Password  string `json:"password"`
	}
	if err := ctx.Bind(&body); err != nil {
		log.Println("error", err)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Request",
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
	password := string(hashPassword)
	user, err := db.Db.CreateUser(ctx.Request.Context(), database.CreateUserParams{
		FirstName: body.FirstName,
		LastName:  body.LastName,
		Email:     body.Email,
		Password:  &password,
	})
	if err != nil {
		log.Println("Failed to create user", err)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Failed to create user",
		})
		return
	}

	token, err := GenerateToken(&user)
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
		"message": "user registered",
	})
}

func Session(ctx *gin.Context) {
	tokenString, err := GetToken(ctx)
	if err != nil || tokenString == "" {
		ctx.JSON(http.StatusOK, gin.H{
			"status": un_authenticated,
			"user":   "",
		})
		return
	}

	payload, err := VerifyToken(tokenString)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{
			"status": un_authenticated,
			"user":   "",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"status": authenticated,
		"user":   payload,
	})
}
func Logout(c *gin.Context) {
	//delete cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("auth_token", "", -1, "/", "", false, true)

	c.JSON(200, "Logout successfully")
}
func GenerateToken(user *database.User) (string, error) {
	payload := &Payload{
		Id:             user.ID.String(),
		Email:          user.Email,
		FirstName:      user.FirstName,
		LastName:       user.LastName,
		ProfilePicture: user.ProfilePicture,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":     user.ID.String(),
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
		"iat":     time.Now().Unix(),
		"payload": *payload,
	})
	tokenString, err := token.SignedString([]byte(os.Getenv("AUTH_SECRET")))
	return tokenString, err
}

func VerifyToken(tokenString string) (*Payload, error) {
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

	if float64(time.Now().Unix()) > claims["exp"].(float64) {
		return nil, fmt.Errorf("token expired")
	}
	var payload Payload
	if err := mapstructure.Decode(claims["payload"], &payload); err != nil {
		return nil, err
	}
	return &payload, nil
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
