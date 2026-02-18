package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq" // needed by sqlc
	"github.com/shemaIkuzwe/thread/internal/db"
	"github.com/shemaIkuzwe/thread/internal/middleware"
	"github.com/shemaIkuzwe/thread/internal/ws"
	"github.com/shemaIkuzwe/thread/utils"
)

func init() {
	utils.LoadEnv()
	db.ConnectDb()
	db.ConnectRedis()
}

func main() {
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("CLIENT_APP_URL")},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: true,
	}))

	v1 := gin.RouterGroup(*router.RouterGroup.Group("/v1"))
	v1.Use(middleware.AuthMiddleware)

	hub := ws.NewHub()
	go hub.Run()

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, "Welcome to our server")
	})
	v1.GET("/ws", func(c *gin.Context) {
		ws.ServeWs(hub, c)
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}
	log.Printf("Starting chat-server at http://localhost:%s", port)
	err := router.Run(":" + port)
	if err != nil {
		log.Fatal("Failed to start server")
	}
	defer db.RedisClient.Close()
}
