package ws

import (
	"encoding/json"
	"log"
	"slices"
	"time"

	"github.com/shemaIkuzwe/thread/internal/redis"
)

type Hub struct {
	clients    map[string]map[string]*ClientConn
	broadcast  chan []byte
	register   chan *ClientConn
	unregister chan *ClientConn
}

type ActiveInfo struct {
	Online int      `json:"online"`
	Users  []string `json:"users"`
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte, 256),
		register:   make(chan *ClientConn),
		unregister: make(chan *ClientConn),
		clients:    make(map[string]map[string]*ClientConn),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.register:
			userID := conn.userID
			connID := conn.connID

			if h.clients[userID] == nil {
				h.clients[userID] = make(map[string]*ClientConn)
				go h.broadcastUserPresence(userID, true)
			}
			h.clients[userID][connID] = conn

		case conn := <-h.unregister:
			if userConns, ok := h.clients[conn.userID]; ok {
				if _, exists := userConns[conn.connID]; exists {
					close(userConns[conn.connID].send)
					delete(userConns, conn.connID)
				}
				if len(userConns) == 0 {
					delete(h.clients, conn.userID)
					go h.broadcastUserPresence(conn.userID, false)
				}
			}

		case message := <-h.broadcast:
			for client, userConns := range h.clients {
				if shouldReceive(message, client) {
					for _, conn := range userConns {
						select {
						case conn.send <- message:
						default:
							close(conn.send)
							delete(userConns, conn.connID)
						}
					}
				}
			}
		}
	}
}

func (h *Hub) broadcastUserPresence(userID string, connected bool) {
	threadIDs, err := getUserThreads(userID)
	if err != nil {
		log.Println("Failed to get user threads:", err)
		return
	}

	eventType := USER_CONNECTED
	if !connected {
		eventType = USER_DISCONNECTED
	}

	for _, threadID := range threadIDs {
		info := updateOnlineCount(threadID, userID, connected)

		msg := Message{
			Message:  info,
			Type:     eventType,
			ThreadID: threadID,
			Date:     time.Now().UTC().Format(time.RFC3339),
		}

		data, err := json.Marshal(msg)
		if err != nil {
			log.Println("Failed to marshal presence message:", err)
			continue
		}
		h.broadcast <- data
	}
}

func updateOnlineCount(threadID, userID string, connected bool) ActiveInfo {
	key := "online:" + threadID
	info, _, _ := redis.Get[ActiveInfo](key)

	if connected {
		if !slices.Contains(info.Users, userID) {
			info.Users = append(info.Users, userID)
		}
	} else {
		info.Users = slices.DeleteFunc(info.Users, func(u string) bool {
			return u == userID
		})
	}
	info.Online = len(info.Users)

	_ = redis.Set(key, info, 0)
	return info
}

func getUserThreads(userID string) ([]string, error) {
	key := "user:threads:" + userID
	threads, _, err := redis.Get[[]string](key)
	if err == nil && len(threads) > 0 {
		return threads, nil
	}

	_ = redis.Publish("user:threads:request", map[string]string{"userId": userID})
	return []string{}, nil
}

func shouldReceive(message []byte, client string) bool {
	msg := &Message{}
	if err := json.Unmarshal(message, msg); err != nil {
		return false
	}

	if msg.Type == UPDATE_LAST_READ && msg.UserID != client {
		return false
	}

	threadUsers, _, _ := redis.Get[[]string]("thread:users:" + msg.ThreadID)
	return slices.Contains(threadUsers, client)
}
