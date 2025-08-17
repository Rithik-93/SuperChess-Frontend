package main

import (
	"github.com/Rithik-93/superchess/services/api-gateway/auth"
	"github.com/Rithik-93/superchess/services/api-gateway/controllers"
	"github.com/Rithik-93/superchess/services/api-gateway/initializers"
	"github.com/Rithik-93/superchess/services/api-gateway/middleware"

	// "github.com/Rithik-93/superchess/shared/env"
	"github.com/gin-contrib/cors"
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
	// frontendURL := env.GetString("FRONTEND_URL", "http://localhost:5173/")

    router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:5173"},
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
    }))
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	router.POST("/signup", controllers.UserSignup)
	router.POST("/login", controllers.UserLogin)
	router.POST("/logout", controllers.UserLogout)
	router.POST("/refresh", controllers.RefreshToken)
    router.GET("/me", controllers.CurrentUser)

	// OAuth
	router.GET("/auth/:provider", auth.BeginAuth)
	router.GET("/auth/:provider/callback", auth.AuthController)

	protected := router.Group("/")
	protected.Use(middleware.RequireAuth)
	{
		protected.POST("/games", controllers.CreateGame)
		protected.POST("/games/join", controllers.JoinGame)
		protected.GET("/games/:gameId", controllers.GetGame)
	}

	router.Run(":3001")
}
