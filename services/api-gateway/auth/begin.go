package auth

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

func BeginAuth(c *gin.Context) {
	provider := c.Param("provider")
	reqWithProvider := c.Request.WithContext(context.WithValue(c.Request.Context(), providerContextKey, provider))
	gothic.BeginAuthHandler(c.Writer, reqWithProvider)
}
