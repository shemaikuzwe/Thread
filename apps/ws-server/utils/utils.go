package utils

import (
	"log"
	"os"
	"regexp"

	"github.com/joho/godotenv"
	"github.com/shemaIkuzwe/thread/internal/chat-pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Printf("Warning: failed to load .env file: %v", err)
	}
}

type ChatServiceClient struct {
	Client chat_pb.ChatServiceClient
}

var ChatService *ChatServiceClient

func InitChatService() {
	url := os.Getenv("CHAT_SERVICE_URL")
	if url == "" {
		log.Fatal("MISSING CHAT_SERVICE_URL")
	}
	parsedUrl,err:= regexp.Compile(`^[a-zA-Z+\-.]+://`)
	if err != nil {
		log.Println("failed to parse url",err)
		return
	}
	url=parsedUrl.ReplaceAllString(url, "")
	conn, err := grpc.NewClient(url, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect to chat service: %v", err)
	}

	client := chat_pb.NewChatServiceClient(conn)
	ChatService = &ChatServiceClient{Client: client}
}
