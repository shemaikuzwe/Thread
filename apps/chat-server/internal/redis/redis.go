package redis

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/shemaIkuzwe/thread/internal/db"
)

// Expire 0 means no expiration time
func Set[T any](key string, val T, expire int) error {
	json, err := json.Marshal(val)
	if err != nil {
		return err
	}
	err = db.RedisClient.Set(context.Background(), key, json, time.Duration(expire)).Err()
	return err
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

	res, err := db.RedisClient.Get(context.Background(), key).Result()
	if err != nil {
		return t, exists, err
	}
	err = json.Unmarshal([]byte(res), &t)
	return t, exists, err
}

func LSet[T any](key string, val T) error {
	err := db.RedisClient.LPush(context.Background(), key, val).Err()
	return err
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
	res, err := db.RedisClient.LRange(context.Background(), key, start, stop).Result()
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
	exists, err := db.RedisClient.Exists(context.Background(), keys...).Result()
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
		return false, errors.New("Cannot find given key")
	}
	_, err = db.RedisClient.Del(context.Background(), keys...).Result()
	if err != nil {
		return false, err
	}
	return true, nil
}
