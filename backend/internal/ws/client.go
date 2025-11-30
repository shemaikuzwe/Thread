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
	"github.com/shemaIkuzwe/thread/internal/controllers"
)

type Message struct {
	ID       string `json:"id"`
	Message  any    `json:"message"`
	ThreadID string `json:"thread_id"`
	UserID   string `json:"user_id"`
	Type     Type   `json:"type"`
	Date     string `json:"created_at"`
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
	maxMessageSize = 512000 // Upgrade this to allown large mesages
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
	// Upgrade HTTP to WebSocket
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	user, err := controllers.GetCurrentUser(ctx)
	if err != nil || user.Id == "" {
		log.Println("error getting user:", err)
		return
	}
	connID := uuid.New().String()

	// Initialize user map if not exists
	if clients[user.Id] == nil {
		clients[user.Id] = make(map[string]*ClientConn)
	}

	client := &ClientConn{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: user.Id,
		connID: connID,
	}

	clients[user.Id][connID] = client
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
	switch msg.Type {
	case MESSAGE:
		err = controllers.HandlerCreateMessage(message, userID)
		if err != nil {
			log.Println("Create messsage Error")
		}
		err = controllers.SendThreadNotification(message)
		if err != nil {
			log.Println("error: ", err)
		}
	case UPDATE_LAST_READ:
		err = controllers.UpsertLastRead(message)
		if err != nil {
			log.Println("Create messsage Error")
		}
	}
}
