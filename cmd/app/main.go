package main

import (
	"github.com/Rithik-93/superchess/cmd/app/initializers"
	"github.com/gin-gonic/gin"
	"github.com/Rithik-93/superchess/cmd/app/controllers"
)

func init() {
	initializers.LoadEnv()
	initializers.ConnectToDB()
	initializers.SyncDatabase()
}

func main() {
	router := gin.Default()
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	router.POST("/signup", controllers.UserSignup)
	router.POST("/login", controllers.UserLogin)
	router.POST("/logout", controllers.UserLogout)
	router.Run()
}
