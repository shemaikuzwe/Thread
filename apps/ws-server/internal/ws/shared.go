package ws

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/shemaIkuzwe/thread/internal/chat-pb"
	"github.com/shemaIkuzwe/thread/internal/redis"
	"github.com/shemaIkuzwe/thread/utils"
)

var jwks keyfunc.Keyfunc

func getJWKS() (keyfunc.Keyfunc, error) {
	if jwks != nil {
		return jwks, nil
	}

	apiUrl := os.Getenv("API_URL")
	if apiUrl == "" {
		return nil, fmt.Errorf("missing API_URL")
	}
	jwksURL := fmt.Sprintf("%s/v1/auth/jwks", apiUrl)
	k, err := keyfunc.NewDefault([]string{jwksURL})
	if err != nil {
		return nil, fmt.Errorf("failed to create JWKS from resource at the given URL: %w", err)
	}

	jwks = k
	return jwks, nil
}

func getUserThreads(userID string) ([]string, error) {
	key := fmt.Sprintf("chats:%s", userID)
	cached, ok, err := redis.Get[[]string](key)
	if ok && err == nil {
		return cached, nil
	}
	res, err := utils.ChatService.Client.GetUserThreads(context.Background(), &chat_pb.UserRequest{UserId: userID})
	if err != nil {
		log.Println("failed to fetch user threads", err)
		return nil, err
	}
	log.Println(res.Threads)
	err = redis.Set(key, res.Threads, int(time.Hour)*24)
	if err != nil {
		log.Println("unable to set cache", err)
	}
	return res.Threads, nil
}

func saveMessage(message Message) error {
	var files []*chat_pb.File
	for _, file := range message.Files {
		files = append(files, &chat_pb.File{
			Name: file.Name,
			Type: file.Type,
			Url:  file.Url,
		})
	}
	res, err := utils.ChatService.Client.SaveMessage(context.Background(), &chat_pb.Message{
		Id:       message.ID,
		ThreadId: message.ThreadID,
		Message:  message.Message.(string),
		Files:    files,
		Type:     chat_pb.Type_MESSAGE,
		UserId:   message.UserID,
	})
	if err != nil {
		return err
	}
	log.Println(res.Message)
	return nil
}

func updateLastRead(message Message) error {
	res, err := utils.ChatService.Client.UpdateLastRead(context.Background(), &chat_pb.Message{
		Id:       message.ID,
		ThreadId: message.ThreadID,
		UserId:   message.UserID,
		Message:  message.Message.(string),
		Type:     chat_pb.Type_UPDATE_LAST_READ,
	})
	if err != nil {
		return err
	}
	log.Println(res.Message)
	return err
}

type authPayload struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Image string `json:"image"`
	jwt.RegisteredClaims
}

func authenticateRequest(r *http.Request) (*authPayload, error) {
	tokenString, err := getToken(r)
	if err != nil || tokenString == "" {
		return nil, err
	}

	k, err := getJWKS()
	if err != nil {
		return nil, fmt.Errorf("JWKS error: %v", err)
	}

	claims := &authPayload{}
	token, err := jwt.ParseWithClaims(tokenString, claims, k.Keyfunc)

	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token: token is unverifiable: %v", err)
	}

	if claims.Subject == "" && claims.ID == "" {
		return nil, fmt.Errorf("missing subject")
	}
	if claims.ID == "" {
		claims.ID = claims.Subject
	}

	return claims, nil
}

func getToken(r *http.Request) (string, error) {
	token := strings.TrimSpace(r.URL.Query().Get("ws_token"))
	if token == "" {
		return "", fmt.Errorf("missing ws_token")
	}
	return token, nil
}
