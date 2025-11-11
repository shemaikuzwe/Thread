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
	Active int
	users  []string
}
type activeInfo struct {
	Active int      `json:"active"`
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
	userChannels, err := db.Db.GetClientChannels(context.Background(), id)
	if err != nil {
		log.Println("failed to get client channels", err)
		return
	}

	for _, channel := range userChannels {
		channelID := channel.String()
		info := h.channels[channelID]
		info.Active++
		info.users = append(info.users, userId)
		h.channels[channelID] = info
		activeInfo := activeInfo{Active: info.Active, Users: info.users}
		msg := Message{
			Message:   activeInfo,
			Type:      "USER_CONNECTED",
			ChannelID: channelID,
			Date:      time.Now().UTC().String(),
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
	userChannels, err := db.Db.GetClientChannels(context.Background(), id)
	if err != nil {
		log.Println("failed to get client channels", err)
		return
	}
	for _, channel := range userChannels {
		channelID := channel.String()
		info := h.channels[channelID]
		info.Active--

		// Find and remove the user from the slice
		for i, u := range info.users {
			if u == userId {
				info.users = append(info.users[:i], info.users[i+1:]...)
				break
			}
		}
		h.channels[channelID] = info
		activeInfo := activeInfo{Active: info.Active, Users: info.users}
		msg := Message{
			Message:   activeInfo,
			Type:      "USER_DISCONNECTED",
			ChannelID: channelID,
			Date:      time.Now().UTC().String(),
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
	msgId, err := uuid.Parse(msg.ChannelID)
	if err != nil {
		log.Println("failed to parse json", err)
		return false, err
	}
	usersChannels, err := getUserChannels(clientUUID)
	if err != nil {
		log.Println("failed to parse json", err)
		return false, err
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
	usersChannels, err := db.Db.GetClientChannels(context.Background(), userId)
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
