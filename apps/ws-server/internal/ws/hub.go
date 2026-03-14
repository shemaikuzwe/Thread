package ws

import (
	"encoding/json"
	"log"
	"slices"
	"time"

	"github.com/shemaIkuzwe/thread/internal/redis"
)

type Hub struct {
	clients   map[string]map[string]*ClientConn
	broadcast chan []byte

	register chan *ClientConn

	unregister chan *ClientConn
	channels   Channels
}

type Channels map[string]struct {
	Online int
	users  []string
}
type activeInfo struct {
	Online int      `json:"online"`
	Users  []string `json:"users"`
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte, 256),
		register:   make(chan *ClientConn),
		unregister: make(chan *ClientConn),
		clients:    make(map[string]map[string]*ClientConn),
		channels:   make(Channels),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.register:
			userID := conn.userID
			connID := conn.connID
			// TODO:Add redis
			if h.clients[userID] == nil {
				h.clients[userID] = make(map[string]*ClientConn)
				go h.incrementChannel(userID)
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
					go h.decrementChannel(conn.userID)
				}
			}

		case message := <-h.broadcast:
			for client, userConns := range h.clients {
				ok, err := CheckUser(message, client)
				if err != nil {
					log.Println("failed to parse json", err)
					continue
				}
				if !ok {
					continue
				}
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

func (h *Hub) incrementChannel(userId string) {
	userThreads, err := getUserThreads(userId)
	if err != nil {
		log.Println("failed to get client channels", err)
		return
	}

	for _, thread := range userThreads {
		ThreadID := thread
		key := "online:" + ThreadID
		// TODO:separate online and users separate redis keys
		info, _, err := redis.Get[activeInfo](key)
		if err != nil {
			log.Println("failed to get online info", err)
			continue
		}

		if !slices.Contains(info.Users, userId) {
			info.Users = append(info.Users, userId)
		}
		info.Online = len(info.Users)

		err = redis.Set(key, info, 0)
		activeInfo := activeInfo{Online: info.Online, Users: info.Users}
		msg := Message{
			Message:  activeInfo,
			Type:     "USER_CONNECTED",
			ThreadID: ThreadID,
			Date:     time.Now().UTC().String(),
		}
		message, err := json.Marshal(msg)
		if err != nil {
			log.Println("failed to marshal outgoing message", err)
			continue
		}
		h.broadcast <- message
	}
}

func (h *Hub) decrementChannel(userId string) {
	userThreads, err := getUserThreads(userId)
	if err != nil {
		log.Println("failed to get client channels", err)
		return
	}
	for _, thread := range userThreads {
		threadID := thread
		key := "online:" + threadID
		info, _, err := redis.Get[activeInfo](key)
		if err != nil {
			log.Println("failed to get active info", err)
			continue
		}

		info.Users = slices.DeleteFunc(info.Users, func(u string) bool {
			return u == userId
		})
		info.Online = len(info.Users)

		err = redis.Set(key, info, 0)
		if err != nil {
			log.Println("failed to set active info", err)
			continue
		}

		activeInfo := activeInfo{Online: info.Online, Users: info.Users}
		msg := Message{
			Message:  activeInfo,
			Type:     "USER_DISCONNECTED",
			ThreadID: threadID,
			Date:     time.Now().UTC().String(),
		}
		message, err := json.Marshal(msg)
		if err != nil {
			log.Println("failed to marshal outgoing message", err)
			continue
		}
		h.broadcast <- message
	}
}

// check if user is in the thread to send message
func CheckUser(message []byte, client string) (bool, error) {
	msg := &Message{}
	err := json.Unmarshal(message, msg)
	if err != nil {
		log.Println("failed to unmarshal broadcast message", err)
		return false, err
	}

	if msg.ThreadID == "" {
		return false, nil
	}

	usersChannels, err := getUserThreads(client)
	if err != nil {
		log.Println("failed to get user channels", err)
		return false, err
	}
	if msg.Type == UPDATE_LAST_READ && msg.UserID != client {
		return false, nil
	}
	if slices.Contains(usersChannels, msg.ThreadID) {
		return true, nil
	}
	return false, nil
}
