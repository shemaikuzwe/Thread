package ws

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/shemaIkuzwe/thread/internal/chat-pb"
	"github.com/shemaIkuzwe/thread/internal/redis"
	"github.com/shemaIkuzwe/thread/utils"
)

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
