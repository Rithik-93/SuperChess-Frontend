package models

import (
	"time"

	"gorm.io/gorm"
)

type GameStatus string

const (
	GameStatusWaiting   GameStatus = "waiting"
	GameStatusActive    GameStatus = "active"
	GameStatusCompleted GameStatus = "completed"
	GameStatusAbandoned GameStatus = "abandoned"
)

type Game struct {
	gorm.Model
	GameID      string     `gorm:"unique;not null"`
	Player1ID   uint       `gorm:"not null"`
	Player1     User       `gorm:"foreignKey:Player1ID"`
	Player2ID   *uint      `gorm:"null"`
	Player2     *User      `gorm:"foreignKey:Player2ID"`
	Status      GameStatus `gorm:"default:'waiting'"`
	FEN         string     `gorm:"default:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'"`
	Moves       string     `gorm:"type:text"`
	CurrentTurn string     `gorm:"default:'white'"`
	Winner      *string    `gorm:"null"`
	EndReason   *string    `gorm:"null"`
	StartedAt   *time.Time `gorm:"null"`
	EndedAt     *time.Time `gorm:"null"`
}
