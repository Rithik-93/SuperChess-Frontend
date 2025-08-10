package initializers

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	// Load environment variables from .env file
	// if err := godotenv.Load(); err != nil {
	// 	log.Fatalf("Error loading .env file")
	// }
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Set default values for environment variables if not set
	if os.Getenv("PORT") == "" {
		os.Setenv("PORT", "3030")
	}
}
