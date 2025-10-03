package controllers

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/shemaIkuzwe/websocket/internal/database"
	"github.com/shemaIkuzwe/websocket/internal/db"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var (
	googleOuthConfig *oauth2.Config
	// prevent CSRF attacks
	oauthStateString = "randomstate"
)

type GoogleUser struct {
	ID         string `json:"id"`
	Email      string `json:"email"`
	Name       string `json:"name"`
	Picture    string `json:"picture"`
	FamilyName string `json:"family_name"`
	GivenName  string `json:"given_name"`
}

func HandleGoogleLogin(ctx *gin.Context) {
	var clientId = os.Getenv("CLIENT_ID")
	var clientSecret = os.Getenv("CLIENT_SECRET")
	var redirectUrl = os.Getenv("REDIRECT_URL")
	googleOuthConfig = &oauth2.Config{
		ClientID:     clientId,
		ClientSecret: clientSecret,
		RedirectURL:  redirectUrl,
		Endpoint:     google.Endpoint,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
	}
	url := googleOuthConfig.AuthCodeURL(oauthStateString)
	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

func HandleGoogleCallback(ctx *gin.Context) {
	if ctx.Request.FormValue("state") != oauthStateString {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "State is not valid",
		})
		return
	}
	token, err := googleOuthConfig.Exchange(ctx.Request.Context(), ctx.Request.FormValue("code"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid code",
		})
		return
	}
	client := googleOuthConfig.Client(ctx.Request.Context(), token)
	res, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Failed to get user info",
		})
		return
	}

	defer res.Body.Close()

	var userInfo GoogleUser

	if err := json.NewDecoder(res.Body).Decode(&userInfo); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Failed to parse json",
		})
		return
	}
	user, err := db.Db.GetUserByEmail(ctx.Request.Context(), userInfo.Email)
	if err != nil {
		user, err = db.Db.CreateUser(ctx.Request.Context(), database.CreateUserParams{
			FirstName:      userInfo.FamilyName,
			LastName:       userInfo.GivenName,
			Email:          userInfo.Email,
			ProfilePicture: userInfo.Picture,
		})
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Failed to create user",
			})
			return
		}
	}
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": err,
		})
		return
	}
	tokenString, err := GenerateToken(&user)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Failed to generate token",
		})
		return
	}
	ctx.SetSameSite(http.SameSiteLaxMode)
	ctx.SetCookie("auth_token", tokenString, 3600*24, "/", "", false, true)
	ctx.Redirect(http.StatusMovedPermanently, "http://localhost:5173/chat")
}
