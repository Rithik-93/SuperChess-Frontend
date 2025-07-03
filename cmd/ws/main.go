package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections for now
	},
}

// Message types
const (
	MsgTypeJoin  = "join"
	MsgTypeMove  = "move"
	MsgTypeState = "state"
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
	From     string `json:"from"`
	To       string `json:"to"`
}

type Player struct {
	ID    string
	Name  string
	Conn  *websocket.Conn
	Color Color
}

type Color string

const (
	ColorBlack Color = "BLACK"
	ColorWhite Color = "WHITE"
)

// FIFO queue for waiting players
var waitingPlayers []*Player
var waitingMutex sync.Mutex

// Updated Game struct with FEN and move history
type Game struct {
	ID        string
	Player1   *Player
	Player2   *Player
	GameState string   // FEN string
	Moves     []string // Move history
	Mutex     sync.Mutex
}

var (
	games      = make(map[string]*Game)
	gamesMutex sync.Mutex
)

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	playerID := uuid.New().String()
	player := &Player{ID: playerID, Conn: conn}

	// Add player to FIFO or match with waiting player

	waitingMutex.Lock()
	if len(waitingPlayers) == 0 {
		waitingPlayers = append(waitingPlayers, player)
		waitingMutex.Unlock()
		log.Printf("Player %s is waiting for a match", playerID)
		return
	}
	// Pop the first waiting player
	opponent := waitingPlayers[0]
	waitingPlayers = waitingPlayers[1:]
	waitingMutex.Unlock()

	// Assign colors
	player.Color = ColorWhite
	opponent.Color = ColorBlack

	// Create new game
	gameID := uuid.New().String()
	game := &Game{
		ID:        gameID,
		Player1:   opponent,
		Player2:   player,
		GameState: "startpos", // Placeholder for FEN
		Moves:     []string{},
	}
	gamesMutex.Lock()
	games[gameID] = game
	gamesMutex.Unlock()

	log.Printf("Game %s started between %s (Black) and %s (White)", gameID, opponent.ID, player.ID)
	// Notify both players (implement message sending as needed)
	// ...
	// Continue with message handling loop as before
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			continue
		}
		var m Message
		if err := json.Unmarshal(msg, &m); err != nil {
			log.Println("Invalid message format:", err)
			continue
		}
		switch m.Type {
		case MsgTypeJoin:
			var data JoinData
			if err := json.Unmarshal(m.Data, &data); err != nil {
				log.Println("Invalid join data:", err)
				continue
			}
			if data.GameID == "" {
				data.GameID = uuid.New().String()
			}
			gamesMutex.Lock()
			game, ok := games[data.GameID]
			if !ok {
				game = &Game{
					ID:        data.GameID,
					GameState: "startpos",
					Moves:     []string{},
				}
				games[data.GameID] = game
			}
			gamesMutex.Unlock()
			// You may want to assign the player to Player1 or Player2 here, depending on your logic
			log.Printf("Player %s joined game %s", playerID, data.GameID)
			// Respond with state (placeholder)
			resp := Message{Type: MsgTypeState, Data: json.RawMessage(`{"msg":"joined game"}`)}
			b, _ := json.Marshal(resp)
			conn.WriteMessage(websocket.TextMessage, b)
		case MsgTypeMove:
			// Handle move (to be implemented)
			log.Println("Received move (not implemented)")
		default:
			log.Println("Unknown message type:", m.Type)
		}
	}
}

func main() {
	http.HandleFunc("/ws", wsHandler)
	log.Println("WebSocket server started on :8080/ws")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
