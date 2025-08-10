package auth

import (
	"context"
	"net/http"

	"github.com/Rithik-93/superchess/services/api-gateway/initializers"
	"github.com/Rithik-93/superchess/services/api-gateway/models"
	"github.com/Rithik-93/superchess/services/api-gateway/utils"
	"github.com/Rithik-93/superchess/shared/env"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

func AuthController(c *gin.Context) {
    provider := c.Param("provider")
    reqWithProvider := c.Request.WithContext(context.WithValue(c.Request.Context(), gothic.ProviderParamKey, provider))
	user, err := gothic.CompleteUserAuth(c.Writer, reqWithProvider)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Upsert user by GoogleID or Email

	var dbUser models.User
	if err := initializers.DB.Where("google_id = ? OR email = ?", user.UserID, user.Email).First(&dbUser).Error; err != nil {

		refreshToken, refreshExp, err := utils.IssueRefreshToken(dbUser)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign refresh token"})
			return
		}

		dbUser = models.User{
			Email:         user.Email,
			Avatar:        user.AvatarURL,
			Name:          user.Name,
			Provider:      provider,
			GoogleID:      user.UserID,
			GoogleToken:   user.AccessToken,
			GoogleRefresh: user.RefreshToken,
			GoogleExpiry:  user.ExpiresAt,
			RefreshToken:  refreshToken,
			RefreshTokenExpiry: refreshExp,
		}
		if err := initializers.DB.Create(&dbUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
			return
		}
	} else {

		dbUser.Email = user.Email
		dbUser.Avatar = user.AvatarURL
		dbUser.Name = user.Name
		dbUser.Provider = provider
		dbUser.GoogleID = user.UserID
		dbUser.GoogleToken = user.AccessToken
		dbUser.GoogleRefresh = user.RefreshToken
		dbUser.GoogleExpiry = user.ExpiresAt
		if err := initializers.DB.Save(&dbUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
			return
		}
	}

    accessToken, _, err := utils.IssueAccessToken(dbUser, provider)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign access token"})
		return
	}

    c.SetCookie("accessToken", accessToken, 3600, "/", "", false, true)

    frontendURL := env.GetString("FRONTEND_URL", "http://localhost:5173/")
    c.Redirect(http.StatusFound, frontendURL)
}
