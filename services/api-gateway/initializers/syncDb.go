package initializers

import "github.com/Rithik-93/superchess/services/api-gateway/models"

func SyncDatabase() {
	DB.AutoMigrate(&models.User{})
}
