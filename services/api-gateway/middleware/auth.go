package middleware

import (
	"net/http"
	"strconv"

	"github.com/Rithik-93/superchess/services/api-gateway/initializers"
	"github.com/Rithik-93/superchess/services/api-gateway/models"
	"github.com/Rithik-93/superchess/shared/env"
	"github.com/gin-gonic/gin"
	jwt "github.com/golang-jwt/jwt/v5"
)

func RequireAuth(c *gin.Context) {
	tokenString, err := c.Cookie("accessToken")
	if err != nil || tokenString == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing access token"})
		c.Abort()
		return
	}

	accessSecret := env.GetString("JWT_ACCESS_SECRET", "lalala")
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(accessSecret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid access token"})
		c.Abort()
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
		c.Abort()
		return
	}

	var userID uint
	switch v := claims["sub"].(type) {
	case float64:
		userID = uint(v)
	case string:
		if parsed, convErr := strconv.Atoi(v); convErr == nil {
			userID = uint(parsed)
		}
	}
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid subject claim"})
		c.Abort()
		return
	}

	var user models.User
	if err := initializers.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		c.Abort()
		return
	}

	c.Set("currentUser", user)
	c.Next()
}
