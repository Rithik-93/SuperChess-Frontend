package controllers

import (
	"net/http"

	"github.com/Rithik-93/superchess/services/api-gateway/initializers"
	"github.com/Rithik-93/superchess/services/api-gateway/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func UserSignup(c *gin.Context) {
	// Get email and password from request body
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

	// Save the user to the database
	result = initializers.DB.Create(&user).Error
	if result != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user: " + result.Error(),
		})
		return
	}

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

	// Compare the password with the hashed password
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Respond with success message
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}

func UserLogout(c *gin.Context) {
	// For now, logout is simple since we don't have session management
	// In a production app, you would invalidate the JWT token or clear the session
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
	})
}
