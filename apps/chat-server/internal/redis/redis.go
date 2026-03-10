package redis

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

var Client *goredis.Client

func Connect() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		log.Fatal("No redis url found")
	}
	opt, err := goredis.ParseURL(redisURL)
	if err != nil {
		log.Fatal("Failed to parse redis url", err)
	}
	Client = goredis.NewClient(opt)
	log.Println("Connected to redis")
}

// Expire 0 means no expiration time
func Set[T any](key string, val T, expire int) error {
	jsonVal, err := json.Marshal(val)
	if err != nil {
		return err
	}
	return Client.Set(context.Background(), key, jsonVal, time.Duration(expire)).Err()
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

	res, err := Client.Get(context.Background(), key).Result()
	if err != nil {
		return t, exists, err
	}
	err = json.Unmarshal([]byte(res), &t)
	return t, exists, err
}

func LSet[T any](key string, val T) error {
	return Client.LPush(context.Background(), key, val).Err()
}

func LGet[T any](key string, start, stop int64) ([]T, bool, error) {
	var t []T
	exists, err := exists(key)
	if err != nil {
		return t, exists, err
	}
	if !exists {
		return t, exists, nil
	}
	res, err := Client.LRange(context.Background(), key, start, stop).Result()
	if err != nil {
		return t, exists, err
	}
	for _, item := range res {
		var i T
		err := json.Unmarshal([]byte(item), &i)
		if err != nil {
			log.Println("error:", err)
			continue
		}
		t = append(t, i)
	}
	return t, exists, nil
}

func exists(keys ...string) (bool, error) {
	exists, err := Client.Exists(context.Background(), keys...).Result()
	ok := exists > 0
	if err != nil {
		return ok, err
	}
	if exists == 0 {
		return ok, nil
	}
	return ok, nil
}

func Delete(keys ...string) (bool, error) {
	exists, err := exists(keys...)
	if err != nil {
		return false, err
	}
	if !exists {
		return false, errors.New("cannot find given key")
	}
	_, err = Client.Del(context.Background(), keys...).Result()
	if err != nil {
		return false, err
	}
	return true, nil
}
