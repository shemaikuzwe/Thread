package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/shemaIkuzwe/websocket/internal/controllers"
)
func AuthMiddleware(c *gin.Context) {
	if strings.Contains(c.Request.URL.Path, "/auth") {
		c.Next()
		return
	}
	tokenString,err:=controllers.GetToken(c)
	if err !=nil || tokenString ==""{
		c.AbortWithStatus(http.StatusUnauthorized)
	}
	if err != nil {
		c.AbortWithStatus(http.StatusUnauthorized)
	}
	payload, err := controllers.VerifyToken(tokenString)
	if err != nil {
		c.AbortWithStatus(http.StatusUnauthorized)
	}
	c.Set("user", payload)

	c.Next()
}