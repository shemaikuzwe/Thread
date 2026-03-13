package ws

import (
	"bytes"
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/shemaIkuzwe/thread/internal/api"
	"github.com/shemaIkuzwe/thread/internal/redis"
)

type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Image string `json:"image"`
}

type Message struct {
	ID       string `json:"id"`
	Message  any    `json:"message"`
	ThreadID string `json:"threadId"`
	UserID   string `json:"userId"`
	Type     Type   `json:"type"`
	Date     string `json:"createdAt"`
	User     *User  `json:"user,omitempty"`
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
		log.Printf("client disconnected user_id=%s conn_id=%s", c.userID, c.connID)

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
		log.Printf("auth failed: %v", err)
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
	log.Printf("client connected user_id=%s conn_id=%s", user.ID, connID)

	// Initialize user map if not exists
	if clients[user.ID] == nil {
		clients[user.ID] = make(map[string]*ClientConn)
	}
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
			log.Printf(
				"failed to persist message type=%s user_id=%s thread_id=%s err=%v",
				msg.Type,
				userID,
				msg.ThreadID,
				err,
			)
			return
		}
	case UPDATE_LAST_READ:
		if err := api.PersistEvent(m); err != nil {
			log.Printf(
				"failed to persist message type=%s user_id=%s thread_id=%s err=%v",
				msg.Type,
				userID,
				msg.ThreadID,
				err,
			)
			return
		}
	}

	err = redis.Client.Publish(context.Background(), "chat.events.v1", m).Err()
	if err != nil {
		log.Printf(
			"failed to publish chat event type=%s user_id=%s thread_id=%s err=%v",
			msg.Type,
			userID,
			msg.ThreadID,
			err,
		)
	}
}

type authPayload struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Image string `json:"image"`
	jwt.RegisteredClaims
}

type jwk struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type jwksResponse struct {
	Keys []jwk `json:"keys"`
}

type jwksCacheEntry struct {
	Keys      map[string]*rsa.PublicKey
	ExpiresAt time.Time
}

var jwksCache = struct {
	mu    sync.RWMutex
	entry jwksCacheEntry
}{
	entry: jwksCacheEntry{Keys: make(map[string]*rsa.PublicKey)},
}

var wsAuthHTTPClient = &http.Client{Timeout: 10 * time.Second}

func authenticateRequest(r *http.Request) (*authPayload, error) {
	tokenString, err := getToken(r)
	if err != nil || tokenString == "" {
		return nil, fmt.Errorf("ws_token is required")
	}

	options := []jwt.ParserOption{
		jwt.WithValidMethods([]string{"RS256", "PS256"}),
		jwt.WithLeeway(time.Duration(clockSkewSeconds()) * time.Second),
		jwt.WithExpirationRequired(),
	}
	if expectedIssuer := strings.TrimSpace(os.Getenv("JWT_ISSUER")); expectedIssuer != "" {
		options = append(options, jwt.WithIssuer(expectedIssuer))
	}
	if expectedAudience := strings.TrimSpace(os.Getenv("JWT_AUDIENCE")); expectedAudience != "" {
		options = append(options, jwt.WithAudience(expectedAudience))
	}

	claims := &authPayload{}
	token, err := jwt.ParseWithClaims(tokenString, claims, jwtKeyFunc, options...)
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	if claims.Subject == "" {
		return nil, fmt.Errorf("missing subject")
	}
	if claims.ID == "" {
		claims.ID = claims.Subject
	}

	return claims, nil
}

func jwtKeyFunc(token *jwt.Token) (any, error) {
	kid, _ := token.Header["kid"].(string)
	if strings.TrimSpace(kid) == "" {
		return nil, fmt.Errorf("missing kid header")
	}
	alg, _ := token.Header["alg"].(string)
	return getPublicKey(kid, alg)
}

func getToken(r *http.Request) (string, error) {
	token := strings.TrimSpace(r.URL.Query().Get("ws_token"))
	if token == "" {
		return "", fmt.Errorf("missing ws_token")
	}
	return token, nil
}

func clockSkewSeconds() int64 {
	raw := strings.TrimSpace(os.Getenv("JWT_CLOCK_SKEW_SECONDS"))
	if raw == "" {
		return 10
	}
	v, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || v < 0 {
		return 10
	}
	return v
}

func getPublicKey(kid, alg string) (*rsa.PublicKey, error) {
	if key := readCachedKey(kid); key != nil {
		return key, nil
	}
	if err := refreshJWKS(false); err != nil {
		log.Printf("jwks refresh failed: %v", err)
	}
	if key := readCachedKey(kid); key != nil {
		return key, nil
	}
	if err := refreshJWKS(true); err != nil {
		return nil, err
	}
	key := readCachedKey(kid)
	if key == nil {
		return nil, fmt.Errorf("kid not found in jwks: %s", kid)
	}
	if alg != "" && !strings.EqualFold(alg, "RS256") && !strings.EqualFold(alg, "PS256") {
		return nil, fmt.Errorf("unsupported alg: %s", alg)
	}
	return key, nil
}

func readCachedKey(kid string) *rsa.PublicKey {
	jwksCache.mu.RLock()
	defer jwksCache.mu.RUnlock()
	if time.Now().After(jwksCache.entry.ExpiresAt) {
		return nil
	}
	return jwksCache.entry.Keys[kid]
}

func refreshJWKS(force bool) error {
	jwksCache.mu.Lock()
	defer jwksCache.mu.Unlock()

	if !force && time.Now().Before(jwksCache.entry.ExpiresAt) && len(jwksCache.entry.Keys) > 0 {
		return nil
	}

	url := jwksURL()
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	res, err := wsAuthHTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("jwks endpoint returned status %d", res.StatusCode)
	}

	var payload jwksResponse
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		return err
	}

	next := make(map[string]*rsa.PublicKey)
	for _, key := range payload.Keys {
		if key.Kid == "" || strings.ToUpper(key.Kty) != "RSA" {
			continue
		}
		pub, err := parseRSAPublicKey(key.N, key.E)
		if err != nil {
			log.Printf("skipping invalid jwk kid=%s: %v", key.Kid, err)
			continue
		}
		next[key.Kid] = pub
	}
	if len(next) == 0 {
		return errors.New("jwks response had no valid RSA keys")
	}

	jwksCache.entry = jwksCacheEntry{
		Keys:      next,
		ExpiresAt: time.Now().Add(5 * time.Minute),
	}
	return nil
}

func jwksURL() string {
	base := strings.TrimRight(os.Getenv("API_URL"), "/")
	if base == "" {
		base = "http://localhost:8000"
	}
	path := strings.TrimSpace(os.Getenv("BETTER_AUTH_JWKS_PATH"))
	if path == "" {
		path = "/v1/auth/jwks"
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return base + path
}

func parseRSAPublicKey(nB64, eB64 string) (*rsa.PublicKey, error) {
	if nB64 == "" || eB64 == "" {
		return nil, errors.New("missing modulus or exponent")
	}

	nBytes, err := base64.RawURLEncoding.DecodeString(nB64)
	if err != nil {
		return nil, fmt.Errorf("invalid modulus: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(eB64)
	if err != nil {
		return nil, fmt.Errorf("invalid exponent: %w", err)
	}
	if len(eBytes) == 0 {
		return nil, errors.New("empty exponent")
	}

	n := new(big.Int).SetBytes(nBytes)
	e := int(new(big.Int).SetBytes(eBytes).Int64())
	if e <= 1 {
		return nil, errors.New("invalid exponent value")
	}

	return &rsa.PublicKey{N: n, E: e}, nil
}
