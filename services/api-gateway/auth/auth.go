package auth

import (
	"net/http"

	"github.com/Rithik-93/superchess/shared/env"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
)

const (
	key    = "superchess"
	MaxAge = 86400 * 30
	isProd = false
)

func NewAuth() {
	googleClientID := env.GetString("GOOGLE_CLIENT_ID", "")
	googleClientSecret := env.GetString("GOOGLE_CLIENT_SECRET", "")
    backendURL := env.GetString("BACKEND_URL", "http://localhost:3000")
    googleCallbackURL := env.GetString("GOOGLE_CALLBACK_URL", backendURL+"/auth/google/callback")

	store := sessions.NewCookieStore([]byte(key))
	store.MaxAge(MaxAge)

	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.Secure = isProd
    store.Options.SameSite = http.SameSiteLaxMode

	gothic.Store = store

    goth.UseProviders(
        google.New(googleClientID, googleClientSecret, googleCallbackURL),
    )
}
