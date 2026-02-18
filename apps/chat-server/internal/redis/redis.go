package redis

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func ConnectRedis() {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_URL"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}
	log.Println("Connected to Redis")
}

func Set[T any](key string, val T, expire int) error {
	data, err := json.Marshal(val)
	if err != nil {
		return err
	}
	return RedisClient.Set(context.Background(), key, data, time.Duration(expire)).Err()
}

func Get[T any](key string) (T, bool, error) {
	var t T
	exists, err := exists(key)
	if err != nil {
		return t, exists, err
	}
	if !exists {
		return t, exists, nil
	}

	res, err := RedisClient.Get(context.Background(), key).Result()
	if err != nil {
		return t, exists, err
	}
	err = json.Unmarshal([]byte(res), &t)
	return t, exists, err
}

func Publish(channel string, message interface{}) error {
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}
	return RedisClient.Publish(context.Background(), channel, data).Err()
}

func Subscribe(ctx context.Context, channel string) *redis.PubSub {
	return RedisClient.Subscribe(ctx, channel)
}

func exists(keys ...string) (bool, error) {
	exists, err := RedisClient.Exists(context.Background(), keys...).Result()
	if err != nil {
		return false, err
	}
	return exists > 0, nil
}

func Delete(keys ...string) (bool, error) {
	exists, err := exists(keys...)
	if err != nil {
		return false, err
	}
	if !exists {
		return false, errors.New("Cannot find given key")
	}
	_, err = RedisClient.Del(context.Background(), keys...).Result()
	if err != nil {
		return false, err
	}
	return true, nil
}
