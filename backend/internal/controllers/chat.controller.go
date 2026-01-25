package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shemaIkuzwe/thread/internal/database"
	"github.com/shemaIkuzwe/thread/internal/db"
	"github.com/shemaIkuzwe/thread/internal/redis"
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
		threads, err := db.Db.GetThreadAndUser(c.Request.Context(), &pattern)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, threads)
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
	threads, err := db.Db.GetThreadsByUserID(c.Request.Context(), uuid)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, threads)
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
	thread, err := db.Db.CreateThread(c.Request.Context(), database.CreateThreadParams{
		Name:        &body.Name,
		Description: &body.Description,
		Type:        database.ThreadTypeGroup,
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
	err = db.Db.CreateThreadUser(c.Request.Context(), database.CreateThreadUserParams{
		UserID:   uuid,
		ThreadID: thread,
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
	c.JSON(201, thread)
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
	thread, err := db.Db.GetDMThread(c.Request.Context(), database.GetDMThreadParams{
		UserID:   user1,
		UserID_2: user2,
	})

	if err == nil && thread.ID.String() != "" {
		c.JSON(http.StatusOK, gin.H{"id": thread.ID.String()})
		return
	}
	chanID, err := db.Db.CreateDMThread(c.Request.Context(), database.ThreadTypeDm)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	err = db.Db.CreateDMThreadUsers(c.Request.Context(), database.CreateDMThreadUsersParams{
		ThreadID: chanID,
		UserID:   user1,
		UserID_2: user2,
	})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
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
	channel, err := db.Db.GetThreadByID(c.Request.Context(), uuid)
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
	err = db.Db.JoinThread(c.Request.Context(), database.JoinThreadParams{
		ThreadID: chanID,
		UserID:   userID,
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
	limitStr := c.Query("limit")
	if limitStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Limit is required"})
	}
	cursorStr := c.Query("cursor")

	threadID, err := uuid.Parse(id)

	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		log.Println("error converting limit string")
	}

	cursor := 0
	if cursorStr != "" {
		cursor, err = strconv.Atoi(cursorStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid cursor format"})
			return
		}
	}

	messages, err := db.Db.GetChannelMessages(c.Request.Context(), database.GetChannelMessagesParams{
		ThreadID: threadID,
		Limit:    int32(limit),
		Offset:   int32(cursor),
	})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	sort.Slice(messages, func(i, j int) bool {
		return messages[i].CreatedAt.Before(messages[j].CreatedAt)
	})
	total, err := db.Db.GetThreadTotalMessages(c.Request.Context(), threadID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	var nextCursor *int
	if len(messages) == limit {
		n := cursor + limit
		nextCursor = &n
	}

	c.JSON(200, gin.H{
		"messages":   messages,
		"total":      total,
		"nextCursor": nextCursor,
	})
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
		Message  string `json:"message"`
		ThreadID string `json:"thread_id"`
		UserID   string `json:"user_id"`
		Date     string `json:"date"`
	}

	err := json.Unmarshal(payload, &msg)
	if err != nil {
		return err
	}
	userId, err := uuid.Parse(msg.UserID)
	if err != nil {
		return err
	}
	threadId, err := uuid.Parse(msg.ThreadID)
	if err != nil {

		return err
	}
	lastMessageId, err := uuid.Parse(msg.Message)
	if err != nil {
		return err
	}
	err = db.Db.UpsertLastRead(context.Background(), database.UpsertLastReadParams{
		ThreadID:          threadId,
		UserID:            userId,
		LastReadMessageID: lastMessageId,
	})
	if err != nil {
		return err
	}
	log.Println("Updated last read message", threadId.String())
	return nil
}

type File struct {
	Name string `json:"name"`
	Url  string `json:"url"`
	Type string `json:"type"`
	Size int    `json:"size"`
}
type Message struct {
	ID       string `json:"id"`
	Message  string `json:"message"`
	ThreadID string `json:"thread_id"`
	Files    []File `json:"files"`
	UserID   string `json:"user_id"`
	Type     string `json:"type"`
	Date     string `json:"created_at"`
}

func HandlerCreateMessage(message []byte, userID string) error {

	var msg Message
	err := json.Unmarshal(message, &msg)
	if err != nil {
		return err
	}
	id, err := uuid.Parse(msg.ID)
	if err != nil {
		return err
	}
	threadUUID, err := uuid.Parse(msg.ThreadID)
	if err != nil {
		return err
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	msgId, err := db.Db.CreateMessage(context.Background(), database.CreateMessageParams{
		ID:       id,
		ThreadID: threadUUID,
		UserID:   userUUID,
		Message:  msg.Message,
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
				return err

			}
		}
	}
	if err != nil {
		return err
	}
	return nil
}
