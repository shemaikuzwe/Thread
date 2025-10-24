package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq" // needed by sqlc
	"github.com/shemaIkuzwe/websocket/internal/controllers"
	"github.com/shemaIkuzwe/websocket/internal/db"
	"github.com/shemaIkuzwe/websocket/internal/middleware"
	"github.com/shemaIkuzwe/websocket/utils"
)

func init() {
	utils.LoadEnv()
	db.ConnectDb()
}

func main() {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},
		// AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: true,
	}))
	router.Use(middleware.AuthMiddleware)
	hub := newHub()
	go hub.run()

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, "Welcome to our chat server")
	})
	router.GET("/ws", func(c *gin.Context) {
		serveWs(hub, c)
	})

	router.POST("/auth/signup", controllers.SignUp)
	router.Any("/auth/login", controllers.HandleLogin)
	router.GET("auth/callback/google", controllers.HandleGoogleCallback)
	router.GET("/auth/session", controllers.Session)
	router.GET("/auth/logout", controllers.Logout)

	router.GET("/users", controllers.GetUsersHandler)
	router.GET("/users/:id", controllers.GetUserHandler)

	router.GET("/chats", controllers.GetChannelsHandler)
	router.POST("/chats", controllers.CreateChannelHandler)
	router.GET("/chats/:id", controllers.GetChannelByIdHandler)
	router.GET("/chats/:id/join", controllers.JoinChannelHandler)
	router.GET("/chats/:id/messages", controllers.GetChannelMessagesHandler)

	log.Println("Starting server at http://localhost:8000")
	err := router.Run(":8000")
	if err != nil {
		log.Fatal("Failed to start server")
	}
}
