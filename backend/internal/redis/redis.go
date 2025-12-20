package redis

import (
	"context"
	"encoding/json"
	"errors"
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
	exists, err := db.RedisClient.Exists(context.Background(), key).Result()
	ok := exists > 0
	if err != nil {
		return t, ok, err
	}
	if exists == 0 {
		return t, ok, nil
	}

	res, err := db.RedisClient.Get(context.Background(), key).Result()
	if err != nil {
		return t, ok, err
	}
	err = json.Unmarshal([]byte(res), &t)
	return t, ok, err
}

func Delete(keys ...string) (bool, error) {
	exists, err := db.RedisClient.Exists(context.Background(), keys...).Result()
	if err != nil {
		return false, err
	}
	if exists == 0 {
		return false, errors.New("Can not find given key")
	}
	_, err = db.RedisClient.Del(context.Background(), keys...).Result()
	if err != nil {
		return false, err
	}
	return true, nil
}
