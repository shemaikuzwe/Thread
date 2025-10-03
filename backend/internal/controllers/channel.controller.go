package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shemaIkuzwe/websocket/internal/database"
	"github.com/shemaIkuzwe/websocket/internal/db"
)

type channel struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func GetChannelsHandler(c *gin.Context) {
	channels, err := db.Db.GetAllChannels(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, channels)
}

func CreateChannelHandler(c *gin.Context) {
	var body channel
	if err := c.BindJSON(&body); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	channel, err := db.Db.CreateChannel(c.Request.Context(), database.CreateChannelParams{
		Name:        body.Name,
		Description: &body.Description,
	})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, channel)
}
func GetChannelByIdHandler(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(400, gin.H{"error": "id is required"})
		return
	}
	uuid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	channel, err := db.Db.GetChannelByID(c.Request.Context(), uuid)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, channel)
}
