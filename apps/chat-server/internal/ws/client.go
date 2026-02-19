package ws

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/shemaIkuzwe/thread/internal/api"
	"github.com/shemaIkuzwe/thread/internal/redis"
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

	// Initialize user map if not exists
	if clients[user.ID] == nil {
		clients[user.ID] = make(map[string]*ClientConn)
	}
	// key := "user:" + user.Id
	// err :=redis.LSet[*&websocket.Conn](key,conn)
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
	m, err := json.Marshal(msg)
	if err != nil {
		log.Println("failed to normalize message payload:", err)
		return
	}
	switch msg.Type {
	case MESSAGE:
		if err := api.PersistEvent(m); err != nil {
			log.Println("failed to persist message:", err)
			return
		}
	case UPDATE_LAST_READ:
		if err := api.PersistEvent(m); err != nil {
			log.Println("failed to update last-read:", err)
			return
		}
	}

	err = redis.Client.Publish(context.Background(), "chat.events.v1", m).Err()
	if err != nil {
		log.Println("failed to publish chat event:", err)
	}
}

type authPayload struct {
	ID string `json:"id"`
	jwt.StandardClaims
}

func authenticateRequest(r *http.Request) (*authPayload, error) {
	tokenString, err := getToken(r)
	if err != nil || tokenString == "" {
		return nil, fmt.Errorf("token is required")
	}

	secret := os.Getenv("AUTH_SECRET")
	payload := &authPayload{}
	token, err := jwt.ParseWithClaims(tokenString, payload, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header)
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	if float64(time.Now().Unix()) > float64(payload.ExpiresAt) {
		return nil, fmt.Errorf("token expired")
	}
	return payload, nil
}

func getToken(r *http.Request) (string, error) {
	if cookie, err := r.Cookie("auth_token"); err == nil {
		return cookie.Value, nil
	}
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", fmt.Errorf("missing auth token")
	}
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return "", fmt.Errorf("invalid authorization header")
	}
	return strings.TrimPrefix(authHeader, "Bearer "), nil
}
