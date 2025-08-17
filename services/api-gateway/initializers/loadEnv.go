package initializers

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found, using default values: %v", err)
	}

	if os.Getenv("PORT") == "" {
		os.Setenv("PORT", "3000")
	}
	if os.Getenv("JWT_ACCESS_SECRET") == "" {
		os.Setenv("JWT_ACCESS_SECRET", "lalala")
	}
	if os.Getenv("JWT_REFRESH_SECRET") == "" {
		os.Setenv("JWT_REFRESH_SECRET", "lalala-refresh")
	}
}
