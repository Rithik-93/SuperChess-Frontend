package main

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
)

type Game struct {
	ID        string
	Player1   *Player
	Player2   *Player
	ChessGame *chess.Game
	Mutex     sync.Mutex
}

var (
	games      = make(map[string]*Game)
	gamesMutex sync.Mutex
)

const (
	MsgTypeJoin     = "join"
	MsgTypeMove     = "move"
	MsgTypeState    = "state"
	MsgTypeGameOver = "gameOver"
	MsgTypeError    = "error"
	MsgTypePlayerInfo = "playerInfo"
)

type Message struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type JoinData struct {
	GameID   string `json:"gameId"`
	PlayerID string `json:"playerId"`
}

type MoveData struct {
	GameID   string `json:"gameId"`
	PlayerID string `json:"playerId"`
	Move     string `json:"move"`
}

type GameStateData struct {
	GameID    string     `json:"gameId"`
	FEN       string     `json:"fen"`
	Board     [][]string `json:"board"`
	Turn      string     `json:"turn"`
	Moves     []string   `json:"moves"`
	InCheck   bool       `json:"inCheck"`
	GameOver  bool       `json:"gameOver"`
	Winner    string     `json:"winner,omitempty"`
	Reason    string     `json:"reason,omitempty"`
}

type ErrorData struct {
	Message string `json:"message"`
}

type PlayerInfoData struct {
	PlayerID string `json:"playerId"`
	Color    string `json:"color"`
	GameID   string `json:"gameId"`
}

type Player struct {
	ID    string
	Name  string
	Conn  *websocket.Conn
	Color Color
}

type Color string

const (
	ColorBlack Color = "black"
	ColorWhite Color = "white"
)