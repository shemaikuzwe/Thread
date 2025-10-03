package main

import (
	"log"
	"strconv"
	"time"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Channel struct {
	// Registered clients.
	clients map[string]map[string]*ClientConn
	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *ClientConn

	// Unregister requests from clients.
	unregister chan *ClientConn
}

func newChannel() *Channel {
	return &Channel{
		broadcast:  make(chan []byte, 256),
		register:   make(chan *ClientConn),
		unregister: make(chan *ClientConn),
		clients:    make(map[string]map[string]*ClientConn),
	}
}

func (h *Channel) run() {
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
			for _, userConns := range h.clients {
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
