package initializers

import "github.com/Rithik-93/superchess/models"

func SyncDatabase() {
	DB.AutoMigrate(&models.User{})
}