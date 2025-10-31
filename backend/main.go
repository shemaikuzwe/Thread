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
	db.ConnectRedis()
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

	v1 := gin.RouterGroup(*router.RouterGroup.Group("/v1"))
	v1.Use(middleware.AuthMiddleware)

	hub := newHub()
	go hub.run()

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, "Welcome to our server")
	})
	v1.GET("/ws", func(c *gin.Context) {
		serveWs(hub, c)
	})

	v1.POST("/auth/signup", controllers.SignUp)
	v1.Any("/auth/login", controllers.HandleLogin)
	v1.GET("auth/callback/google", controllers.HandleGoogleCallback)
	v1.GET("/auth/session", controllers.Session)
	v1.GET("/auth/logout", controllers.Logout)

	// TODO:Protect this users route admin only
	v1.GET("/users", controllers.GetUsersHandler)
	v1.GET("/users/:id", controllers.GetUserHandler)

	v1.GET("/chats", controllers.GetChannelsHandler)
	v1.POST("/chats", controllers.CreateChannelHandler)
	v1.POST("/chats/dm", controllers.CreateDMChannel)
	v1.GET("/chats/new", controllers.GetNewChatsHandler) //This will be used to get users and channels to create new chat from
	v1.GET("/chats/:id", controllers.GetChannelByIdHandler)
	v1.GET("/chats/:id/join", controllers.JoinChannelHandler)
	v1.GET("/chats/:id/messages", controllers.GetChannelMessagesHandler)

	log.Println("Starting server at http://localhost:8000")
	err := router.Run(":8000")
	if err != nil {
		log.Fatal("Failed to start server")
	}
}
