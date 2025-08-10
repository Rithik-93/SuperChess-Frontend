package main

import (
	"github.com/Rithik-93/superchess/services/api-gateway/auth"
	"github.com/Rithik-93/superchess/services/api-gateway/controllers"
	"github.com/Rithik-93/superchess/services/api-gateway/initializers"
	"github.com/gin-gonic/gin"
)

func init() {
	initializers.LoadEnv()
	initializers.ConnectToDB()
	initializers.SyncDatabase()
}

func main() {
	auth.NewAuth()
	router := gin.Default()
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	router.POST("/signup", controllers.UserSignup)
	router.POST("/login", controllers.UserLogin)
	router.POST("/logout", controllers.UserLogout)
	router.GET("/auth/:provider", auth.BeginAuth)
	router.GET("/auth/:provider/callback", auth.AuthController)

	router.Run()
}
