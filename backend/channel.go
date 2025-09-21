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
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newChannel() *Channel {
	return &Channel{
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Channel) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			msg := Message{Message: strconv.Itoa(len(h.clients)), Type: USER_CONNECTED, Date: time.Now().UTC().String()}
			message, err := toBYTE(&msg)
			if err != nil {
				log.Println("failed to parse json", err)
				break
			}
			h.broadcast <- message
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				msg := Message{Message: strconv.Itoa(len(h.clients)), Type: USER_DISCONNECTED, Date: time.Now().UTC().String()}
				message, err := toBYTE(&msg)
				if err != nil {
					log.Println("failed to parse json", err)
					break
				}
				h.broadcast <- message
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
