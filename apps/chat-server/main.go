package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/shemaIkuzwe/thread/internal/redis"
	"github.com/shemaIkuzwe/thread/internal/ws"
	"github.com/shemaIkuzwe/thread/utils"
)

func init() {
	utils.LoadEnv()
	redis.ConnectRedis()
}

func main() {
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("CLIENT_URL")},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization", "Cookie"},
		AllowCredentials: true,
	}))

	hub := ws.NewHub()
	go hub.Run()

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Chat server running"})
	})

	router.GET("/ws", ws.AuthMiddleware(), func(c *gin.Context) {
		ws.ServeWs(hub, c)
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	log.Println("Chat server starting on :" + port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start chat server:", err)
	}
}
