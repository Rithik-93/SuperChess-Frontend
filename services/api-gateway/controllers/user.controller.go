package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Rithik-93/superchess/services/api-gateway/initializers"
	"github.com/Rithik-93/superchess/services/api-gateway/models"
	"github.com/Rithik-93/superchess/services/api-gateway/utils"
	"github.com/Rithik-93/superchess/shared/env"
	"github.com/gin-gonic/gin"
	jwt "github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func UserSignup(c *gin.Context) {
	var signupBody struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&signupBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	var existingUser models.User
	result := initializers.DB.Where("email = ?", signupBody.Email).First(&existingUser).Error
	if result == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User with this email already exists",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(signupBody.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to hash password",
		})
		return
	}

	user := models.User{
		Email:    signupBody.Email,
		Password: string(hashedPassword),
	}

	refreshToken, refreshExp, err := utils.IssueRefreshToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to sign refresh token",
		})
		return
	}
	user.RefreshToken = refreshToken
	user.RefreshTokenExpiry = refreshExp

	accessToken, _, err := utils.IssueAccessToken(user, "email")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to sign access token",
		})
		return
	}

	result = initializers.DB.Create(&user).Error
	if result != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user: " + result.Error(),
		})
		return
	}

	c.SetCookie("accessToken", accessToken, 3600, "/", "", false, true)
	c.SetCookie("refreshToken", refreshToken, 2592000, "/", "", false, true)
	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}

func UserLogin(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	var user models.User
	result := initializers.DB.Where("email = ?", body.Email).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

    err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}
    accessToken, _, err := utils.IssueAccessToken(user, "email")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sign access token"})
        return
    }
    refreshToken, refreshExp, err := utils.IssueRefreshToken(user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sign refresh token"})
        return
    }
    user.RefreshToken = refreshToken
    user.RefreshTokenExpiry = refreshExp
    if err := initializers.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist refresh token"})
        return
    }

    c.SetCookie("accessToken", accessToken, 3600, "/", "", false, true)
    c.SetCookie("refreshToken", refreshToken, 2592000, "/", "", false, true) // 30 days
    c.JSON(http.StatusOK, gin.H{
        "message": "Login successful",
        "user": gin.H{
            "id":    user.ID,
            "email": user.Email,
        },
    })
}

func UserLogout(c *gin.Context) {
    // Clear both access and refresh token cookies
    c.SetCookie("accessToken", "", -1, "/", "", false, true)
    c.SetCookie("refreshToken", "", -1, "/", "", false, true)
    c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}

func RefreshToken(c *gin.Context) {
    refreshTokenString := c.GetHeader("Authorization")
    if refreshTokenString == "" {
        if cookie, err := c.Cookie("refreshToken"); err == nil {
            refreshTokenString = cookie
        }
    }
    
    if refreshTokenString == "" {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
        return
    }
    
    if len(refreshTokenString) > 7 && refreshTokenString[:7] == "Bearer " {
        refreshTokenString = refreshTokenString[7:]
    }
    
    refreshSecret := env.GetString("JWT_REFRESH_SECRET", "lalalalalala")
    token, err := jwt.Parse(refreshTokenString, func(t *jwt.Token) (interface{}, error) {
        return []byte(refreshSecret), nil
    })
    
    if err != nil || !token.Valid {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
        return
    }
    
    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
        return
    }
    
    if claims["type"] != "refresh" {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token type"})
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
        return
    }
    
    var user models.User
    if err := initializers.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
        return
    }
    
    if user.RefreshToken != refreshTokenString {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token mismatch"})
        return
    }
    
    if time.Now().After(user.RefreshTokenExpiry) {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token expired"})
        return
    }
    
    accessToken, _, err := utils.IssueAccessToken(user, "email")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue access token"})
        return
    }
    
    c.SetCookie("accessToken", accessToken, 3600, "/", "", false, true)
    
    c.JSON(http.StatusOK, gin.H{
        "message": "Token refreshed successfully",
        "accessToken": accessToken,
    })
}

func CurrentUser(c *gin.Context) {
    tokenString, err := c.Cookie("accessToken")
    if err != nil || tokenString == "" {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "missing access token"})
        return
    }

    accessSecret := env.GetString("JWT_ACCESS_SECRET", "lalala")
    token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
        return []byte(accessSecret), nil
    })
    if err != nil || !token.Valid {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid access token"})
        return
    }

    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
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
        return
    }

    var user models.User
    if err := initializers.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "user": gin.H{
            "id":       user.ID,
            "email":    user.Email,
            "name":     user.Name,
            "avatar":   user.Avatar,
            "provider": user.Provider,
        },
    })
}
