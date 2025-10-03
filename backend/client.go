package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/shemaIkuzwe/websocket/internal/controllers"
	"github.com/shemaIkuzwe/websocket/internal/database"
	"github.com/shemaIkuzwe/websocket/internal/db"
)

type Message struct {
	Message   string `json:"message"`
	ChannelID string `json:"channel_id"`
	UserID    string `json:"user_id"`
	Type      Type   `json:"type"`
	Date      string `json:"date"`
}

type Type string

const (
	USER_CONNECTED    Type = "USER_CONNECTED"
	USER_DISCONNECTED Type = "USER_DISCONNECTED"
	MESSAGE           Type = "MESSAGE"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

type ClientConn struct {
	channel *Channel
	conn    *websocket.Conn
	send    chan []byte
	userID  string
	connID  string
}

// Map of userID -> map[connID]*ClientConn
var clients = make(map[string]map[string]*ClientConn)

func (c *ClientConn) readPump() {
	defer func() {
		// unregister client when done
		c.channel.unregister <- c
		c.conn.Close()

		// cleanup from clients map
		if userMap, ok := clients[c.userID]; ok {
			delete(userMap, c.connID)
			if len(userMap) == 0 {
				delete(clients, c.userID)
			}
		}
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("read error: %v", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
		c.channel.broadcast <- message
		go handlerCreateMessage(message, c.userID)
	}
}

func (c *ClientConn) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func serveWs(channel *Channel, ctx *gin.Context) {
	// Upgrade HTTP to WebSocket
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	user, err := controllers.GetCurrentUser(ctx)
	if err != nil {
		log.Println("error getting user:", err)
		return
	}
	connID := uuid.New().String()

	// Initialize user map if not exists
	if clients[user.Id] == nil {
		clients[user.Id] = make(map[string]*ClientConn)
	}

	client := &ClientConn{
		channel: channel,
		conn:    conn,
		send:    make(chan []byte, 256),
		userID:  user.Id,
		connID:  connID,
	}

	clients[user.Id][connID] = client
	channel.register <- client

	go client.writePump()
	go client.readPump()
}

func toJSON(b []byte) (*Message, error) {
	msg := Message{}
	err := json.Unmarshal(b, &msg)
	return &msg, err
}
func toBYTE(m *Message) ([]byte, error) {
	msg, err := json.Marshal(m)
	return msg, err
}

func handlerCreateMessage(message []byte, userID string) {
	msg, err := toJSON(message)
	if err != nil {
		log.Println("json parse error:", err)
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

	err = db.Db.CreateMessage(context.Background(), database.CreateMessageParams{
		ChannelID: chanUUID,
		UserID:    userUUID,
		Message:   msg.Message,
	})

	if err != nil {
		log.Println("db create message error:", err)
	}
}
