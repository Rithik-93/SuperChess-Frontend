package initializers

import "github.com/Rithik-93/superchess/cmd/app/models"

func SyncDatabase() {
	DB.AutoMigrate(&models.User{})
}