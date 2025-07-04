package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections for now
	},
}

// Message types
const (
	MsgTypeJoin     = "join"
	MsgTypeMove     = "move"
	MsgTypeState    = "state"
	MsgTypeGameOver = "gameOver"
	MsgTypeError    = "error"
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
	Move     string `json:"move"` // Move in algebraic notation (e.g., "e4", "Nf3", "O-O")
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

// FIFO queue for waiting players
var waitingPlayers []*Player
var waitingMutex sync.Mutex

// Game struct using notnil/chess
type Game struct {
	ID        string
	Player1   *Player // White player
	Player2   *Player // Black player
	ChessGame *chess.Game
	Mutex     sync.Mutex
}

var (
	games      = make(map[string]*Game)
	gamesMutex sync.Mutex
)

func (g *Game) getBoardArray() [][]string {
	board := make([][]string, 8)
	for i := range board {
		board[i] = make([]string, 8)
	}
	
	position := g.ChessGame.Position()
	boardMap := position.Board().SquareMap()
	
	for square, piece := range boardMap {
		file := int(square.File())
		rank := int(square.Rank())
		board[7-rank][file] = piece.String()
	}
	
	return board
}

func (g *Game) getCurrentTurn() string {
	if g.ChessGame.Position().Turn() == chess.White {
		return "white"
	}
	return "black"
}

func (g *Game) isPlayerTurn(playerID string) bool {
	currentTurn := g.getCurrentTurn()
	if currentTurn == "white" && g.Player1 != nil && g.Player1.ID == playerID {
		return true
	}
	if currentTurn == "black" && g.Player2 != nil && g.Player2.ID == playerID {
		return true
	}
	return false
}

func (g *Game) isPositionInCheck() bool {
	// Simple check detection: if the position status is related to check
	// For now, we'll check if any of the recent moves had a Check tag
	moves := g.ChessGame.Moves()
	if len(moves) > 0 {
		lastMove := moves[len(moves)-1]
		return lastMove.HasTag(chess.Check)
	}
	return false
}

func (g *Game) sendStateToPlayers() {
	stateData := GameStateData{
		GameID:   g.ID,
		FEN:      g.ChessGame.FEN(),
		Board:    g.getBoardArray(),
		Turn:     g.getCurrentTurn(),
		Moves:    convertMovesToStrings(g.ChessGame.Moves()),
		InCheck:  g.isPositionInCheck(),
		GameOver: g.ChessGame.Outcome() != chess.NoOutcome,
	}

	if g.ChessGame.Outcome() != chess.NoOutcome {
		stateData.GameOver = true
		switch g.ChessGame.Outcome() {
		case chess.WhiteWon:
			stateData.Winner = "white"
			stateData.Reason = g.ChessGame.Method().String()
		case chess.BlackWon:
			stateData.Winner = "black"
			stateData.Reason = g.ChessGame.Method().String()
		case chess.Draw:
			stateData.Reason = g.ChessGame.Method().String()
		}
	}

	msg := Message{Type: MsgTypeState}
	data, _ := json.Marshal(stateData)
	msg.Data = data
	msgBytes, _ := json.Marshal(msg)

	if g.Player1 != nil && g.Player1.Conn != nil {
		g.Player1.Conn.WriteMessage(websocket.TextMessage, msgBytes)
	}
	if g.Player2 != nil && g.Player2.Conn != nil {
		g.Player2.Conn.WriteMessage(websocket.TextMessage, msgBytes)
	}
}

func (g *Game) sendErrorToPlayer(player *Player, errorMsg string) {
	if player == nil || player.Conn == nil {
		return
	}
	
	errorData := ErrorData{Message: errorMsg}
	msg := Message{Type: MsgTypeError}
	data, _ := json.Marshal(errorData)
	msg.Data = data
	msgBytes, _ := json.Marshal(msg)
	
	player.Conn.WriteMessage(websocket.TextMessage, msgBytes)
}

func convertMovesToStrings(moves []*chess.Move) []string {
	result := make([]string, len(moves))
	for i, move := range moves {
		result[i] = move.String()
	}
	return result
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	playerID := uuid.New().String()
	player := &Player{ID: playerID, Conn: conn}

	log.Printf("Player %s connected", playerID)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read error for player %s: %v", playerID, err)
			break
		}
		
		var m Message
		if err := json.Unmarshal(msg, &m); err != nil {
			log.Printf("Invalid message format from player %s: %v", playerID, err)
			continue
		}
		
		switch m.Type {
		case MsgTypeJoin:
			handleJoin(player, m.Data)
		case MsgTypeMove:
			handleMove(player, m.Data)
		default:
			log.Printf("Unknown message type from player %s: %s", playerID, m.Type)
		}
	}
}

func handleJoin(player *Player, data json.RawMessage) {
	var joinData JoinData
	if err := json.Unmarshal(data, &joinData); err != nil {
		log.Printf("Invalid join data from player %s: %v", player.ID, err)
		return
	}

	waitingMutex.Lock()
	defer waitingMutex.Unlock()

	if len(waitingPlayers) == 0 {
		// No waiting players, add this player to the queue
		waitingPlayers = append(waitingPlayers, player)
		log.Printf("Player %s is waiting for a match", player.ID)
		return
	}

	// Match with the first waiting player
	opponent := waitingPlayers[0]
	waitingPlayers = waitingPlayers[1:]

	// Assign colors (first player is white, second is black)
	opponent.Color = ColorWhite
	player.Color = ColorBlack

	// Create new game
	gameID := uuid.New().String()
	game := &Game{
		ID:        gameID,
		Player1:   opponent, // White player
		Player2:   player,   // Black player
		ChessGame: chess.NewGame(),
	}
	
	gamesMutex.Lock()
	games[gameID] = game
	gamesMutex.Unlock()

	log.Printf("Game %s started between %s (White) and %s (Black)", gameID, opponent.ID, player.ID)
	
	// Send initial game state to both players
	game.sendStateToPlayers()
}

func handleMove(player *Player, data json.RawMessage) {
	var moveData MoveData
	if err := json.Unmarshal(data, &moveData); err != nil {
		log.Printf("Invalid move data from player %s: %v", player.ID, err)
		return
	}

	gamesMutex.Lock()
	game, exists := games[moveData.GameID]
	gamesMutex.Unlock()
	
	if !exists {
		log.Printf("Game %s not found for player %s", moveData.GameID, player.ID)
		return
	}

	game.Mutex.Lock()
	defer game.Mutex.Unlock()

	// Check if it's the player's turn
	if !game.isPlayerTurn(player.ID) {
		game.sendErrorToPlayer(player, "It's not your turn")
		return
	}

	// Check if game is over
	if game.ChessGame.Outcome() != chess.NoOutcome {
		game.sendErrorToPlayer(player, "Game is already over")
		return
	}

	// Parse and validate the move using algebraic notation
	if err := game.ChessGame.MoveStr(moveData.Move); err != nil {
		game.sendErrorToPlayer(player, "Invalid move: "+err.Error())
		return
	}
	
	log.Printf("Player %s made move %s in game %s", player.ID, moveData.Move, game.ID)

	// Send updated game state to both players
	game.sendStateToPlayers()
}

func main() {
	http.HandleFunc("/ws", wsHandler)
	log.Println("WebSocket server started on :8080/ws")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
