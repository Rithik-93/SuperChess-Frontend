package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true 
	},
}

const JWT_SECRET = "lalala"

var db *gorm.DB

type GameModel struct {
	gorm.Model
	GameID      string `gorm:"unique;not null"`
	Player1ID   uint   `gorm:"not null"`
	Player2ID   *uint  `gorm:"null"`
	Status      string `gorm:"default:'waiting'"`
	FEN         string `gorm:"default:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'"`
	Moves       string `gorm:"type:text"` // JSON string of moves array
	CurrentTurn string `gorm:"default:'white'"`
	Winner      *string `gorm:"null"`
	EndReason   *string `gorm:"null"`
	StartedAt   *time.Time `gorm:"null"`
	EndedAt     *time.Time `gorm:"null"`
}

var waitingPlayers []*Player
var waitingMutex sync.Mutex




func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	defer func() {
		// This will run when the connection is closed
		// The connection cleanup is handled in the message loop
	}()

	gameID := r.URL.Query().Get("gameId")
	
	var player *Player
	
	if gameID != "" {
		// Reconnection to existing game
		cookie, err := r.Cookie("accessToken")
		if err != nil || cookie.Value == "" {
			log.Println("Missing access token cookie for game reconnection")
			conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"error","data":{"message":"Missing authentication"}}`))
			return
		}

		userID, err := validateAccessToken(cookie.Value)
		if err != nil {
			log.Printf("Invalid access token: %v", err)
			conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"error","data":{"message":"Invalid authentication"}}`))
			return
		}

		closeExistingConnections(userID)
		
		player = &Player{
			ID:   userID,
			Conn: conn,
		}

		log.Printf("Player %d reconnecting to game %s", player.ID, gameID)
		
		if err := handleReconnection(player, gameID); err != nil {
			log.Printf("Failed to reconnect player to game: %v", err)
			conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"error","data":{"message":"Failed to reconnect to game"}}`))
			return
		}
	} else {
		cookie, err := r.Cookie("accessToken")
		if err != nil || cookie.Value == "" {
			log.Println("Missing access token cookie")
			conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"error","data":{"message":"Missing authentication"}}`))
			return
		}

		userID, err := validateAccessToken(cookie.Value)
		if err != nil {
			log.Printf("Invalid access token: %v", err)
			conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"error","data":{"message":"Invalid authentication"}}`))
			return
		}

		closeExistingConnections(userID)
		
		player = &Player{
			ID:   userID,
			Conn: conn,
		}

		log.Printf("Player %d connected for matchmaking", player.ID)
	}

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read error for player %d: %v", player.ID, err)
			// Remove player from game/queue on disconnect
			if gameID != "" {
				removePlayerFromGame(player, gameID)
			} else {
				removePlayerFromQueue(player)
			}
			break
		}
		
		var m Message
		if err := json.Unmarshal(msg, &m); err != nil {
			log.Printf("Invalid message format from player %d: %v", player.ID, err)
			continue
		}
		
		switch m.Type {
		case MsgTypeJoin:
			handleJoin(player, m.Data)
		case MsgTypeMove:
			handleMove(player, m.Data)
		case MsgTypeCreateGame:
			handleCreateGame(player, m.Data)
		case MsgTypeJoinInvite:
			handleJoinInvite(player, m.Data)
		default:
			log.Printf("Unknown message type from player %d: %s", player.ID, m.Type)
		}
	}
}

// validateAccessToken validates JWT access token and returns user ID
func validateAccessToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(JWT_SECRET), nil
	})
	if err != nil || !token.Valid {
		return 0, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, jwt.ErrInvalidKey
	}

	var userID uint
	switch v := claims["sub"].(type) {
	case float64:
		userID = uint(v)
	case string:
		if parsed, convErr := strconv.Atoi(v); convErr == nil {
			userID = uint(parsed)
		}
	}
	if userID == 0 {
		return 0, jwt.ErrInvalidKey
	}

	return userID, nil
}

// handleJoin handles a player joining the matchmaking queue
func handleJoin(player *Player, data json.RawMessage) {
	waitingMutex.Lock()
	defer waitingMutex.Unlock()

	if len(waitingPlayers) == 0 {
		waitingPlayers = append(waitingPlayers, player)
		log.Printf("Player %d is waiting for a match", player.ID)
		return
	}

	opponent := waitingPlayers[0]
	waitingPlayers = waitingPlayers[1:]

	// Create game in database (if available)
	gameID := uuid.New().String()
	if db != nil {
		gameModel := GameModel{
			GameID:    gameID,
			Player1ID: opponent.ID,
			Player2ID: &player.ID,
			Status:    "active",
			StartedAt: &time.Time{},
		}
		*gameModel.StartedAt = time.Now()

		if err := db.Create(&gameModel).Error; err != nil {
			log.Printf("Failed to create game in database: %v", err)
			// Continue without database persistence
		}
	}

	// Set colors
	opponent.Color = ColorWhite
	player.Color = ColorBlack

	// Create in-memory game
	game := &Game{
		ID:        gameID,
		Player1:   opponent,
		Player2:   player,
		ChessGame: chess.NewGame(),
	}
	
	gamesMutex.Lock()
	games[gameID] = game
	gamesMutex.Unlock()

	log.Printf("Game %s started between %d (White) and %d (Black)", gameID, opponent.ID, player.ID)
	
	// Send player info with gameID to both players
	sendPlayerInfo(opponent, gameID, "white")
	sendPlayerInfo(player, gameID, "black")
	
	// Send initial game state
	game.sendStateToPlayers()
}

// handleReconnection handles a player reconnecting to an existing game
func handleReconnection(player *Player, gameID string) error {
	// Check if game exists in memory first
	gamesMutex.Lock()
	game, exists := games[gameID]
	gamesMutex.Unlock()
	
	if exists {
		// Game exists in memory, determine player color and reconnect
		game.Mutex.Lock()
		defer game.Mutex.Unlock()
		
		// Determine color based on existing game state and replace old connection
		if game.Player1 != nil && game.Player1.ID == player.ID {
			// Close old connection if it's different
			if game.Player1.Conn != player.Conn {
				game.Player1.Conn.Close()
			}
			player.Color = ColorWhite
			game.Player1 = player
		} else if game.Player2 != nil && game.Player2.ID == player.ID {
			// Close old connection if it's different
			if game.Player2.Conn != player.Conn {
				game.Player2.Conn.Close()
			}
			player.Color = ColorBlack
			game.Player2 = player
		} else {
			if game.Player1 == nil {
				player.Color = ColorWhite
				game.Player1 = player
			} else if game.Player2 == nil {
				player.Color = ColorBlack
				game.Player2 = player
			} else {
				return fmt.Errorf("game is full")
			}
		}
		
		log.Printf("Player %d reconnected to game %s as %s", player.ID, gameID, player.Color)
		
		// Send player info to the reconnected player
		sendPlayerInfo(player, gameID, string(player.Color))
		
		// Check if opponent is connected
		if (player.Color == ColorWhite && game.Player2 == nil) || (player.Color == ColorBlack && game.Player1 == nil) {
			log.Printf("Player %d reconnected but opponent is not connected", player.ID)
		}
		
		// Send current game state
		game.sendStateToPlayer(player)
		return nil
	}
	
	if db != nil {
		var gameModel GameModel
		if err := db.Where("game_id = ?", gameID).First(&gameModel).Error; err != nil {
			return fmt.Errorf("game not found: %v", err)
		}

		if gameModel.Player1ID != player.ID && (gameModel.Player2ID == nil || *gameModel.Player2ID != player.ID) {
			return fmt.Errorf("player not part of this game")
		}

		if gameModel.Player1ID == player.ID {
			player.Color = ColorWhite
		} else {
			player.Color = ColorBlack
		}

		chessGame := chess.NewGame()
		if gameModel.FEN != "" && gameModel.FEN != "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" {
			fen, err := chess.FEN(gameModel.FEN)
			if err == nil {
				chessGame = chess.NewGame(fen)
			}
		}
		
		game = &Game{
			ID:        gameID,
			ChessGame: chessGame,
		}
		
		// Assign player to correct position
		if player.Color == ColorWhite {
			game.Player1 = player
		} else {
			game.Player2 = player
		}
		
		gamesMutex.Lock()
		games[gameID] = game
		gamesMutex.Unlock()

		log.Printf("Player %d reconnected to game %s as %s (loaded from DB)", player.ID, gameID, player.Color)
		
		sendPlayerInfo(player, gameID, string(player.Color))
		
		game.sendStateToPlayer(player)
		return nil
	}
	
	return fmt.Errorf("game not found and no database available")
}

func handleCreateGame(player *Player, data json.RawMessage) {
	gameID := uuid.New().String()
	
	if db != nil {
		gameModel := GameModel{
			GameID:    gameID,
			Player1ID: player.ID,
			Status:    "waiting",
		}

		if err := db.Create(&gameModel).Error; err != nil {
			log.Printf("Failed to create game in database: %v", err)
		}
	}

	// Create in-memory game
	game := &Game{
		ID:        gameID,
		Player1:   player,
		ChessGame: chess.NewGame(),
	}
	
	// Set player1 as white
	player.Color = ColorWhite
	
	gamesMutex.Lock()
	games[gameID] = game
	gamesMutex.Unlock()

	log.Printf("Game %s created by player %d, waiting for another player", gameID, player.ID)
	
	// Send game ID back to the creator
	sendGameCreated(player, gameID)
}

// handleJoinInvite handles joining a specific game by ID
func handleJoinInvite(player *Player, data json.RawMessage) {
	var joinInviteData JoinInviteData
	if err := json.Unmarshal(data, &joinInviteData); err != nil {
		log.Printf("Invalid join invite data from player %d: %v", player.ID, err)
		return
	}

	if db != nil {
		var gameModel GameModel
		if err := db.Where("game_id = ? AND status = ?", joinInviteData.GameID, "waiting").First(&gameModel).Error; err != nil {
			log.Printf("Game %s not found in database, checking memory", joinInviteData.GameID)
		} else {
			// Check if player is trying to join their own game
			if gameModel.Player1ID == player.ID {
				sendErrorToPlayer(player, "Cannot join your own game")
				return
			}

			gameModel.Player2ID = &player.ID
			gameModel.Status = "active"
			now := time.Now()
			gameModel.StartedAt = &now

			if err := db.Save(&gameModel).Error; err != nil {
				log.Printf("Failed to update game in database: %v", err)
				// Continue without database persistence
			}
		}
	}

	// Update in-memory game
	gamesMutex.Lock()
	game, exists := games[joinInviteData.GameID]
	gamesMutex.Unlock()
	
	if !exists {
		log.Printf("Game %s not found in memory for player %d", joinInviteData.GameID, player.ID)
		sendErrorToPlayer(player, "Game not found")
		return
	}

	game.Mutex.Lock()
	defer game.Mutex.Unlock()

	game.Player2 = player
	player.Color = ColorBlack

	log.Printf("Player %d joined game %s as black", player.ID, joinInviteData.GameID)
	
	sendPlayerInfo(game.Player1, joinInviteData.GameID, "white")
	sendPlayerInfo(player, joinInviteData.GameID, "black")
	
	game.sendStateToPlayers()
}

// removePlayerFromGame handles player disconnection
func removePlayerFromGame(player *Player, gameID string) {
	gamesMutex.Lock()
	game, exists := games[gameID]
	gamesMutex.Unlock()
	
	if !exists {
		return
	}

	game.Mutex.Lock()
	defer game.Mutex.Unlock()

	if game.Player1 != nil && game.Player1.ID == player.ID {
		// Close the connection before removing
		if game.Player1.Conn != nil {
			game.Player1.Conn.Close()
		}
		game.Player1 = nil
		log.Printf("Player %d (white) disconnected from game %s", player.ID, gameID)
	} else if game.Player2 != nil && game.Player2.ID == player.ID {
		// Close the connection before removing
		if game.Player2.Conn != nil {
			game.Player2.Conn.Close()
		}
		game.Player2 = nil
		log.Printf("Player %d (black) disconnected from game %s", player.ID, gameID)
	}
}

// removePlayerFromQueue removes player from waiting queue
func removePlayerFromQueue(player *Player) {
	waitingMutex.Lock()
	defer waitingMutex.Unlock()
	
	for i, p := range waitingPlayers {
		if p.ID == player.ID {
			waitingPlayers = append(waitingPlayers[:i], waitingPlayers[i+1:]...)
			log.Printf("Player %d removed from waiting queue", player.ID)
			break
		}
	}
}

// closeExistingConnections closes any existing connections for a user
func closeExistingConnections(userID uint) {
	gamesMutex.Lock()
	defer gamesMutex.Unlock()
	
	for _, game := range games {
		game.Mutex.Lock()
		if game.Player1 != nil && game.Player1.ID == userID {
			if game.Player1.Conn != nil {
				game.Player1.Conn.Close()
				log.Printf("Closed existing connection for player %d in game %s", userID, game.ID)
			}
		}
		if game.Player2 != nil && game.Player2.ID == userID {
			if game.Player2.Conn != nil {
				game.Player2.Conn.Close()
				log.Printf("Closed existing connection for player %d in game %s", userID, game.ID)
			}
		}
		game.Mutex.Unlock()
	}
}

// initDatabase initializes the database connection
func initDatabase() {
	// You should load these from environment variables
	dsn := "host=localhost user=postgres password=password dbname=superchess port=5432 sslmode=disable"
	
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("Warning: Failed to connect to database: %v", err)
		log.Println("Running without database persistence - games will only exist in memory")
		return
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&GameModel{})
	if err != nil {
		log.Printf("Warning: Failed to migrate database: %v", err)
		log.Println("Running without database persistence - games will only exist in memory")
		db = nil
		return
	}

	log.Println("Database connected and migrated successfully")
}

// updateGameStateInDB updates the game state in database
func updateGameStateInDB(gameID, fen, moves, currentTurn string, winner, endReason *string) {
	if db == nil {
		return // No database connection
	}
	
	updates := map[string]interface{}{
		"fen":          fen,
		"moves":        moves,
		"current_turn": currentTurn,
	}

	if winner != nil {
		updates["winner"] = *winner
		updates["status"] = "completed"
		now := time.Now()
		updates["ended_at"] = &now
	}

	if endReason != nil {
		updates["end_reason"] = *endReason
	}

	if err := db.Model(&GameModel{}).Where("game_id = ?", gameID).Updates(updates).Error; err != nil {
		log.Printf("Failed to update game state in database: %v", err)
	}
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
	
	log.Printf("Player %d made move %s in game %s", player.ID, moveData.Move, game.ID)

	// Update game state in database
	movesJson, _ := json.Marshal(convertMovesToStrings(game.ChessGame.Moves()))
	var winner, endReason *string
	if game.ChessGame.Outcome() != chess.NoOutcome {
		switch game.ChessGame.Outcome() {
		case chess.WhiteWon:
			w := "white"
			winner = &w
		case chess.BlackWon:
			w := "black"
			winner = &w
		}
		r := game.ChessGame.Method().String()
		endReason = &r
	}
	
	updateGameStateInDB(game.ID, game.ChessGame.FEN(), string(movesJson), game.getCurrentTurn(), winner, endReason)

	game.sendStateToPlayers()
}

func main() {
	// Initialize database
	initDatabase()
	
	http.HandleFunc("/ws", wsHandler)
	log.Println("WebSocket server started on :8080/ws")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
