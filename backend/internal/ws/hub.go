package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"slices"
	"time"

	"github.com/google/uuid"
	"github.com/shemaIkuzwe/thread/internal/db"
	"github.com/shemaIkuzwe/thread/internal/redis"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[string]map[string]*ClientConn
	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *ClientConn

	// Unregister requests from clients.
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
			//Add redis
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
					break
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
	id, err := uuid.Parse(userId)
	if err != nil {
		log.Println("failed to parse user id", err)
		return
	}
	userThreads, err := db.Db.GetClientThreads(context.Background(), id)
	if err != nil {
		log.Println("failed to get client channels", err)
		return
	}

	for _, thread := range userThreads {
		ThreadID := thread.String()
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
	id, err := uuid.Parse(userId)
	if err != nil {
		log.Println("failed to parse user id", err)
		return
	}
	userThreads, err := db.Db.GetClientThreads(context.Background(), id)
	if err != nil {
		log.Println("failed to get client channels", err)
		return
	}
	for _, thread := range userThreads {
		threadID := thread.String()
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

// check if user is in the channel to send message
func CheckUser(message []byte, client string) (bool, error) {
	msg := &Message{}
	err := json.Unmarshal(message, msg)
	if err != nil {
		log.Println("failed to parse json", err)
		return false, err
	}
	clientUUID, err := uuid.Parse(client)
	if err != nil {
		log.Println("failed to parse json", err)
		return false, err
	}
	msgId, err := uuid.Parse(msg.ThreadID)
	if err != nil {
		log.Println("failed to parse json", err)
		return false, err
	}
	usersChannels, err := getUserChannels(clientUUID)
	if err != nil {
		log.Println("failed to parse json", err)
		return false, err
	}
	if msg.Type == UPDATE_LAST_READ && msg.UserID != client {
		return false, nil
	}
	if slices.Contains(usersChannels, msgId) {
		return true, nil
	}
	return false, nil
}

func getUserChannels(userId uuid.UUID) ([]uuid.UUID, error) {
	key := fmt.Sprintf("chats:%s", userId)
	cached, ok, err := redis.Get[[]uuid.UUID](key)
	if ok && err == nil {
		return cached, nil
	}
	usersChannels, err := db.Db.GetClientThreads(context.Background(), userId)
	if err != nil {
		log.Println("failed to parse json", err)
		return nil, err
	}
	err = redis.Set(key, usersChannels, int(time.Hour)*24)
	if err != nil {
		log.Println("unable to set cache", err)
	}
	return usersChannels, nil
}
