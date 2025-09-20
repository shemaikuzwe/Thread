package main

import (
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, "Welcome to our chat server")
	})
	channel := newChannel()
	go channel.run()
	router.GET("/ws", func(c *gin.Context) {
		serveWs(channel,c)
	})
	log.Println("Starting server at http://localhost:8000")
	err := router.Run(":8000")
	if err != nil {
		log.Fatal("Failed to start server")
	}
}
