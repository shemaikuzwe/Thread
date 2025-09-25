package db

import (
	"database/sql"
	"log"
	"os"

	"github.com/shemaIkuzwe/websocket/internal/database"
)

var Db *database.Queries

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
