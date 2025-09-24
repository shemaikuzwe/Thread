package auth

import (
	"log"
	"net/http"
	// "net/http"

	"github.com/gin-gonic/gin"
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
		return;
	}
     
	// use credentials
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
	})
}
