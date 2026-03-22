package ws

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Image string `json:"image"`
}
type Files struct {
	Url  string `json:"url"`
	Name string `json:"name"`
	Type string `json:"type"`
	Size int64  `json:"size"`
}
type Message struct {
	ID       string  `json:"id"`
	Message  any     `json:"message"`
	ThreadID string  `json:"threadId"`
	UserID   string  `json:"userId"`
	Type     Type    `json:"type"`
	Date     string  `json:"createdAt"`
	User     *User   `json:"user,omitempty"`
	Files    []Files `json:"files,omitempty"`
}

type Type string

const (
	USER_CONNECTED    Type = "USER_CONNECTED"
	USER_DISCONNECTED Type = "USER_DISCONNECTED"
	MESSAGE           Type = "MESSAGE"
	UPDATE_LAST_READ  Type = "UPDATE_LAST_READ"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512000 // Upgrade this to allown large messages
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
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	userID string
	connID string
}

// Map of userID -> map[connID]*ClientConn
var clients = make(map[string]map[string]*ClientConn)

func (c *ClientConn) readPump() {
	defer func() {
		// unregister client when done
		c.hub.unregister <- c
		c.conn.Close()
		log.Printf("client disconnected user_id=%s conn_id=%s", c.userID, c.connID)

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
		c.hub.broadcast <- message
		go messageCallback(message, c.userID)
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

func ServeWs(hub *Hub, ctx *gin.Context) {
	user, err := authenticateRequest(ctx.Request)
	if err != nil || user.ID == "" {
		log.Printf("auth failed: %v", err)
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	// Upgrade HTTP to WebSocket
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	connID := uuid.New().String()
	log.Printf("client connected user_id=%s conn_id=%s", user.ID, connID)

	// Initialize user map if not exists
	if clients[user.ID] == nil {
		clients[user.ID] = make(map[string]*ClientConn)
	}
	client := &ClientConn{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: user.ID,
		connID: connID,
	}

	clients[user.ID][connID] = client
	hub.register <- client

	go client.writePump()
	go client.readPump()
}

func messageCallback(message []byte, userID string) {
	var msg Message
	err := json.Unmarshal(message, &msg)
	if err != nil {
		log.Println("Parsing error: ", err)
		return
	}
	msg.UserID = userID

	switch msg.Type {
	case MESSAGE:
		if err := saveMessage(msg); err != nil {
			log.Printf(
				"failed to save message type=%s user_id=%s thread_id=%s err=%v",
				msg.Type,
				userID,
				msg.ThreadID,
				err,
			)
			return
		}
	case UPDATE_LAST_READ:
		if err := updateLastRead(msg); err != nil {
			log.Printf(
				"failed to persist message type=%s user_id=%s thread_id=%s err=%v",
				msg.Type,
				userID,
				msg.ThreadID,
				err,
			)
			return
		}
	}
}
