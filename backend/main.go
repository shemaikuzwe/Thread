package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/shemaIkuzwe/websocket/internal/auth"
	"github.com/shemaIkuzwe/websocket/utils"
)

func init() {
	utils.LoadEnv()
	log.Println("loaded env variables")
}

func main() {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		// AllowOrigins: []string{"http://localhost:5173"},
		AllowAllOrigins: true,
		AllowHeaders:    []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
	}))
	channel := newChannel()
	go channel.run()
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, "Welcome to our chat server")
	})
	router.GET("/ws", func(c *gin.Context) {
		serveWs(channel, c)
	})
	router.Any("/auth/login", auth.HandleLogin)
	router.GET("/callback/google", auth.HandleGoogleCallback)
	log.Println("Starting server at http://localhost:8000")
	err := router.Run(":8000")
	if err != nil {
		log.Fatal("Failed to start server")
	}
}
