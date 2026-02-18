package utils

import (
	"log"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	// In local development, env vars are usually provided by docker compose
	// or shell exports. LoadEnv is best-effort for local .env files.
	err := godotenv.Load()
	if err != nil {
		log.Printf("Warning: failed to load .env file: %v", err)
	}
}
