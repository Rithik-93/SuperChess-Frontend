package env

import (
    "os"
)

// GetString returns the value of the environment variable or the defaultValue if not set.
func GetString(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}


