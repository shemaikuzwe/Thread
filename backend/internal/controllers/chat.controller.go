package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shemaIkuzwe/websocket/internal/database"
	"github.com/shemaIkuzwe/websocket/internal/db"
	"github.com/shemaIkuzwe/websocket/internal/redis"
)

type channel struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func GetChatsHandler(c *gin.Context) {
	user, err := GetCurrentUser(c)
	search := strings.TrimSpace(c.Query("search"))
	if search != "" {
		pattern := "%" + search + "%"
		channels, err := db.Db.GetChannelAndUser(c.Request.Context(), &pattern)
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
func GetUnReadChatsHandler(c *gin.Context) {
	user, err := GetCurrentUser(c)
	if err != nil {
		c.JSON(400, gin.H{"error": "user not found"})
		return
	}
	userID, err := uuid.Parse(user.Id)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	chats, err := db.Db.GetUnReadChatsByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, chats)
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
	key := fmt.Sprintf("chats:%s", uuid.String())
	ok, _ := redis.Delete(key)
	if ok {
		log.Println("Deleted cache")
	}
	c.JSON(201, channel)
}

func CreateDMChat(c *gin.Context) {
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
	key := fmt.Sprintf("chats:%s", user1.String())
	key2 := fmt.Sprintf("chats:%s", user2.String())
	ok, _ := redis.Delete(key, key2)
	if ok {
		log.Println("Deleted cache")
	}
	c.JSON(201, gin.H{"id": chanID.String()})
}

func GetChatsByIdHandler(c *gin.Context) {
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
	key := fmt.Sprintf("chats:%s", userID.String())
	ok, _ := redis.Delete(key)
	if ok {
		log.Println("successfully deleted cache")
	}

	c.JSON(201, gin.H{"message": "Joined channel"})
}
func GetChatMessagesHandler(c *gin.Context) {
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

func UpsertLastRead(payload []byte) error {
	var msg struct {
		Message   string `json:"message"`
		ChannelID string `json:"channel_id"`
		UserID    string `json:"user_id"`
		Date      string `json:"date"`
	}

	err := json.Unmarshal(payload, &msg)
	if err != nil {
		return err
	}
	userId, err := uuid.Parse(msg.UserID)
	if err != nil {
		return err
	}
	chanId, err := uuid.Parse(msg.ChannelID)
	if err != nil {

		return err
	}
	lastMessageId, err := uuid.Parse(msg.Message)
	if err != nil {
		return err
	}
	err = db.Db.UpsertLastRead(context.Background(), database.UpsertLastReadParams{
		ChannelID:         chanId,
		LastReadMessageID: lastMessageId,
		UserID:            userId,
	})
	if err != nil {
		return err
	}
	log.Println("Updated last read message", lastMessageId.String())
	return nil
}

type File struct {
	Name string `json:"name"`
	Url  string `json:"url"`
	Type string `json:"type"`
	Size int    `json:"size"`
}

func HandlerCreateMessage(message []byte, userID string) {

	var msg struct {
		ID        string `json:"id"`
		Message   string `json:"message"`
		ChannelID string `json:"channel_id"`
		Files     []File `json:"files"`
		UserID    string `json:"user_id"`
		Type      string `json:"type"`
		Date      string `json:"created_at"`
	}
	err := json.Unmarshal(message, &msg)
	if err != nil {
		log.Println("json parse error:", err)
		return
	}
	if msg.Type != "MESSAGE" {
		return
	}
	id, err := uuid.Parse(msg.ID)
	if err != nil {
		log.Println("Invalid message uuuid", err)
		return
	}
	chanUUID, err := uuid.Parse(msg.ChannelID)
	if err != nil {
		log.Println("invalid channel id:", err)
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		log.Println("invalid user id:", err)
		return
	}

	msgId, err := db.Db.CreateMessage(context.Background(), database.CreateMessageParams{
		ID:        id,
		ChannelID: chanUUID,
		UserID:    userUUID,
		Message:   msg.Message,
	})
	if len(msg.Files) > 0 {
		// TODO:Use bulk insert
		for _, file := range msg.Files {
			err = db.Db.CreateFiles(context.Background(), database.CreateFilesParams{
				Url:       file.Url,
				Type:      file.Type,
				Size:      int32(file.Size),
				Name:      file.Name,
				MessageID: &msgId,
			})
			if err != nil {
				log.Println("error creating file", err)

			}
		}
	}
	if err != nil {
		log.Println("db create message error:", err)
	}
}
