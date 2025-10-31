package controllers

import (
	"errors"
	"log"
	"net/http"
	"strings"

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
	user, err := GetCurrentUser(c)
	search := strings.TrimSpace(c.Query("search"))
	if search != "" {
		pattern := "%" + search + "%"
		channels, err := db.Db.GetChannelsByName(c.Request.Context(), &pattern)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, channels)
		return
	}
	if err != nil {
		c.JSON(400, gin.H{"error": "user not found"})
		return
	}
	uuid, err := uuid.Parse(user.Id)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	channels, err := db.Db.GetChannelsByUserID(c.Request.Context(), uuid)
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
		Name:        &body.Name,
		Description: &body.Description,
		Type:        database.ChannelTypeGroup,
	})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	user, err := GetCurrentUser(c)
	if err != nil {
		c.JSON(400, gin.H{"error": "user not found"})
		return
	}
	uuid, err := uuid.Parse(user.Id)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	//create Relation channel_user
	err = db.Db.CreateChannelUser(c.Request.Context(), database.CreateChannelUserParams{
		UserID:    uuid,
		ChannelID: channel,
	})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, channel)
}

func CreateDMChannel(c *gin.Context) {
	var body struct {
		UserID string `json:"user_id"`
	}
	err := c.BindJSON(&body)
	if err != nil {
		c.JSON(400, gin.H{"json error": err.Error()})
		return
	}
	user, err := GetCurrentUser(c)
	if err != nil {
		c.JSON(400, gin.H{"error": "user not found"})
		return
	}
	user1, err := uuid.Parse(user.Id)
	if err != nil {
		c.JSON(400, gin.H{"parse1 error": err.Error()})
		return
	}
	user2, err := uuid.Parse(body.UserID)
	if err != nil {
		c.JSON(400, gin.H{"parse2 error": err.Error()})
		return
	}
	//Check if channel already exists
	channel, err := db.Db.GetDMChannel(c.Request.Context(), database.GetDMChannelParams{
		UserID:   user1,
		UserID_2: user2,
	})
	if err != nil {
		log.Println("error", err)
	}
	log.Println("existing", channel)
	if channel.ID.String() != "" {
		c.JSON(http.StatusOK, gin.H{"id": channel.ID.String()})
		return
	}
	chanID, err := db.Db.CreateDMChannel(c.Request.Context(), database.ChannelTypeDm)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	err = db.Db.CreateDMChannelUsers(c.Request.Context(), database.CreateDMChannelUsersParams{ChannelID: chanID,
		UserID:   user1,
		UserID_2: user2,
	})
	c.JSON(201, gin.H{"id": chanID.String()})
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
func JoinChannelHandler(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(400, gin.H{"error": "id is required"})
		return
	}
	chanID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(400, gin.H{"error": "Failed to parse uuid"})
	}
	user, err := GetCurrentUser(c)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	userID, err := uuid.Parse(user.Id)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	err = db.Db.JoinChannel(c.Request.Context(), database.JoinChannelParams{
		ChannelID: chanID,
		UserID:    userID,
	})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"message": "Joined channel"})
}
func GetChannelMessagesHandler(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(400, gin.H{"error": "id is required"})
		return
	}
	chanID, err := uuid.Parse(id)

	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	messages, err := db.Db.GetChannelMessages(c.Request.Context(), chanID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, messages)
}
func GetCurrentUser(c *gin.Context) (Payload, error) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(400, gin.H{"error": "user not found"})
		return Payload{}, errors.New("user not found")
	}
	return user.(Payload), nil
}
func GetNewChatsHandler(c *gin.Context) {
	search := c.Query("search")
	if search == "" {
		c.JSON(http.StatusOK, gin.H{})
	}
	pattern := "%" + search + "%"
	chats, err := db.Db.GetChannelAndUser(c.Request.Context(), &pattern)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, chats)
}
