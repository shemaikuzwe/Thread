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
	redis.Connect()
	utils.InitChatService()
}

func main() {
	router := gin.New()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("CLIENT_APP_URL")},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	v1 := gin.RouterGroup(*router.RouterGroup.Group("/v1"))

	hub := ws.NewHub()
	go hub.Run()

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, "Welcome to our server")
	})
	v1.GET("/ws", func(c *gin.Context) {
		ws.ServeWs(hub, c)
	})

	router.GET("/health/live", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	router.GET("/health/ready", func(c *gin.Context) {
		err := redis.Client.Ping(c.Request.Context()).Err()
		if err != nil {
			c.JSON(503, gin.H{
				"status": "unhealthy",
				"redis":  err.Error(),
			})
			return
		}
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	log.Printf("Starting chat-server at http://localhost:%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server")
	}

	defer redis.Client.Close()
}
