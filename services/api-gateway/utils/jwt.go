package utils

import (
	"time"

	"github.com/Rithik-93/superchess/services/api-gateway/models"
	"github.com/Rithik-93/superchess/shared/env"
	jwt "github.com/golang-jwt/jwt/v5"
)

// IssueAccessToken creates an app-issued access JWT for the given user and provider.
// It returns the signed token string and its expiration time.
func IssueAccessToken(user models.User, provider string) (string, time.Time, error) {
	accessSecret := env.GetString("JWT_ACCESS_SECRET", "lalala")
	accessTTLStr := env.GetString("ACCESS_TOKEN_TTL", "15m")

	accessTTL, err := time.ParseDuration(accessTTLStr)
	if err != nil {
		accessTTL = 15 * time.Minute
	}

	now := time.Now()
	accessExp := now.Add(accessTTL)

	accessTokenClaims := jwt.MapClaims{
		"sub":      user.ID,
		"email":    user.Email,
		"provider": provider,
		"type":     "access",
		"exp":      accessExp.Unix(),
		"iat":      now.Unix(),
	}
	accessTokenJwt := jwt.NewWithClaims(jwt.SigningMethodHS256, accessTokenClaims)
	accessToken, err := accessTokenJwt.SignedString([]byte(accessSecret))
	if err != nil {
		return "", time.Time{}, err
	}
	return accessToken, accessExp, nil
}

// IssueRefreshToken creates an app-issued refresh JWT for the given user.
// It returns the signed token string and its expiration time.
func IssueRefreshToken(user models.User) (string, time.Time, error) {
	refreshSecret := env.GetString("JWT_REFRESH_SECRET", "lalalalalala")
	refreshTTLStr := env.GetString("REFRESH_TOKEN_TTL", "720h")

	refreshTTL, err := time.ParseDuration(refreshTTLStr)
	if err != nil {
		refreshTTL = 24 * 30 * time.Hour
	}

	now := time.Now()
	refreshExp := now.Add(refreshTTL)

	refreshTokenClaims := jwt.MapClaims{
		"sub":  user.ID,
		"type": "refresh",
		"exp":  refreshExp.Unix(),
		"iat":  now.Unix(),
	}
	refreshTokenJwt := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshTokenClaims)
	refreshToken, err := refreshTokenJwt.SignedString([]byte(refreshSecret))
	if err != nil {
		return "", time.Time{}, err
	}
	return refreshToken, refreshExp, nil
}