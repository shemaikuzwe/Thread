package db

import (
	"database/sql"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
	"github.com/shemaIkuzwe/websocket/internal/database"
)

var Db *database.Queries
var RedisClient *redis.Client

func ConnectDb() {
	dbUrl := os.Getenv("DATABASE_URL")

	if dbUrl == "" {
		log.Fatal("No database url found")
	}
	conn, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal("Failed to open connection", err)
	}
	Db = database.New(conn)
	log.Println("Connected to the database")
}

func ConnectRedis() {
	redisUrl := os.Getenv("REDIS_URL")
	if redisUrl == "" {
		log.Fatal("No redis url found")
	}
	opt, err := redis.ParseURL(redisUrl)
	if err != nil {
		log.Fatal("Failed to parse redis url", err)
	}
	RedisClient = redis.NewClient(opt)
	log.Println("Connected to the redis")
}
