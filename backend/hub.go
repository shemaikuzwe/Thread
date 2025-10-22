package main

import (
	"context"
	"log"
	"slices"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/shemaIkuzwe/websocket/internal/db"
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
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte, 256),
		register:   make(chan *ClientConn),
		unregister: make(chan *ClientConn),
		clients:    make(map[string]map[string]*ClientConn),
		channels:   make(Channels),
	}
}

func (h *Hub) run() {
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
				message := []byte(`{"message":"` + strconv.Itoa(len(h.clients)) + `","type":"USER_DISCONNECTED","date":"` + time.Now().UTC().String() + `"}`)
				h.broadcast <- message
			}

		case message := <-h.broadcast:
			for client, userConns := range h.clients {
				ok, err := CheckUser(message, client)
				if err != nil {
					log.Println("failed to parse json", err)
					break
				}
				if !ok {
					log.Println("this client does not belong to this channel")
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
		log.Println("ranging over channel", channel)
		channelID := channel.String()
		info := h.channels[channelID]
		info.Active++
		h.channels[channelID] = info
		log.Println("chan", h.channels)
		message := []byte(`{"message":"` + strconv.Itoa(info.Active) + `","type":"USER_CONNECTED","channel_id":"` + channelID + `","date":"` + time.Now().UTC().String() + `"}`)
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
		h.channels[channelID] = info
		message := []byte(`{"message":"` + strconv.Itoa(info.Active) + `","type":"USER_CONNECTED","channel_id":"` + channelID + `","date":"` + time.Now().UTC().String() + `"}`)
		h.broadcast <- message
	}
}

// check if user is in the channel to send message
func CheckUser(message []byte, client string) (bool, error) {
	msg, err := toJSON(message)
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

	usersChannels, err := db.Db.GetClientChannels(context.Background(), clientUUID)
	if err != nil {
		log.Println("failed to parse json", err)
		return false, err
	}
	if slices.Contains(usersChannels, msgId) {
		return true, nil
	}
	return false, nil
}
