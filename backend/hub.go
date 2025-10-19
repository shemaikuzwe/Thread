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
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte, 256),
		register:   make(chan *ClientConn),
		unregister: make(chan *ClientConn),
		clients:    make(map[string]map[string]*ClientConn),
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
			}
			h.clients[userID][connID] = conn
			msg := Message{Message: strconv.Itoa(len(h.clients)), Type: USER_CONNECTED, Date: time.Now().UTC().String()}
			message, err := toBYTE(&msg)
			if err != nil {
				log.Println("failed to parse json", err)
				break
			}
			h.broadcast <- message
		case conn := <-h.unregister:

			if userConns, ok := h.clients[conn.userID]; ok {
				if _, exists := userConns[conn.connID]; exists {
					close(userConns[conn.connID].send)
					delete(userConns, conn.connID)
				}
				if len(userConns) == 0 {
					delete(h.clients, conn.userID)
				}
				msg := Message{Message: strconv.Itoa(len(h.clients)), Type: USER_DISCONNECTED, Date: time.Now().UTC().String()}
				message, err := toBYTE(&msg)
				if err != nil {
					log.Println("failed to parse json", err)
					break
				}
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
	log.Println("userChannels", usersChannels, msgId)
	if slices.Contains(usersChannels, msgId) {
		return true, nil
	}
	return false, nil
}
