package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email         string `gorm:"unique"`
	Avatar        string
	Name          string
	Provider      string
	Password      string
	GoogleID      string `gorm:"unique"`
	GoogleRefresh string
	GoogleToken   string
	GoogleExpiry  time.Time
	RefreshToken       string
	RefreshTokenExpiry time.Time
}
