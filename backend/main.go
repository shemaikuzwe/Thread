package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq" // needed by sqlc
	"github.com/shemaIkuzwe/thread/internal/controllers"
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

	v1.POST("/auth/signup", controllers.SignUp)
	v1.Any("/auth/login", controllers.HandleLogin)
	v1.GET("auth/callback/google", controllers.HandleGoogleCallback)
	v1.GET("/auth/session", controllers.Session)
	v1.GET("/auth/logout", controllers.Logout)

	// TODO:Protect this users route admin only
	v1.GET("/users", controllers.GetUsersHandler)
	v1.GET("/users/:id", controllers.GetUserHandler)
	v1.POST("/users/subscription", controllers.SubscripeUserHandler)
	v1.DELETE("/users/subscription/:endpoint", controllers.UnSubscripeUserHandler)

	v1.GET("/chats", controllers.GetChatsHandler)
	v1.GET("/chats/unread", controllers.GetUnReadChatsHandler)
	v1.POST("/chats", controllers.CreateChannelHandler)
	v1.POST("/chats/dm", controllers.CreateDMChat)
	v1.GET("/chats/:id", controllers.GetChatsByIdHandler)
	v1.GET("/chats/:id/join", controllers.JoinChannelHandler)
	v1.GET("/chats/:id/messages", controllers.GetChatMessagesHandler)

	log.Println("Starting server at http://localhost:8000")
	err := router.Run(":8000")
	if err != nil {
		log.Fatal("Failed to start server")
	}
	defer db.RedisClient.Close()
}
