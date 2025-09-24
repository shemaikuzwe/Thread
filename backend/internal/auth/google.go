package auth

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var (
	googleOuthConfig *oauth2.Config
	// prevent CSRF attacks
	oauthStateString = "randomstate"
)

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
	
	res, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "failed to get user info",
		})
		return
	}

	defer res.Body.Close()

	var userInfo map[string]interface{}

	if err := json.NewDecoder(res.Body).Decode(&userInfo); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "failed to parse json",
		})
		return
	}
	data, _ := json.MarshalIndent(userInfo, "", " ")
	log.Println("userdata", string(data))

	ctx.JSON(http.StatusOK, gin.H{
		"message": "user logged in sucessfully",
	})
}
