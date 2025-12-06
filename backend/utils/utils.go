package utils

import (
	"log"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	// When running the backend server, either with 'go run' or 'docker-compose',
	// the working directory is the project root. Therefore, we need to
	// specify the path to the .env file in the backend directory.
	err := godotenv.Load()
	if err != nil {
		log.Printf("Warning: failed to load backend/.env file: %v", err)
	}
}
