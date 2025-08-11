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
		return true 
	},
}


// FIFO queue for waiting players
var waitingPlayers []*Player
var waitingMutex sync.Mutex

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
		Player1:   opponent,
		Player2:   player,
		ChessGame: chess.NewGame(),
	}
	
	gamesMutex.Lock()
	games[gameID] = game
	gamesMutex.Unlock()

	log.Printf("Game %s started between %s (White) and %s (Black)", gameID, opponent.ID, player.ID)
	
	// Send player info to both players
	sendPlayerInfo(opponent, gameID, "white")
	sendPlayerInfo(player, gameID, "black")
	
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
