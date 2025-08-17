package controllers

import (
	"net/http"
	"time"

	"github.com/Rithik-93/superchess/services/api-gateway/initializers"
	"github.com/Rithik-93/superchess/services/api-gateway/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateGameRequest struct {
	GameType string `json:"gameType"`
}

type JoinGameRequest struct {
	GameID string `json:"gameId"`
}

type GameResponse struct {
	GameID      string    `json:"gameId"`
	Status      string    `json:"status"`
	Player1     UserInfo  `json:"player1"`
	Player2     *UserInfo `json:"player2,omitempty"`
	PlayerColor string    `json:"playerColor"`
	CreatedAt   time.Time `json:"createdAt"`
}

type UserInfo struct {
	ID     uint   `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Avatar string `json:"avatar"`
}

func CreateGame(c *gin.Context) {
	currentUser, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user := currentUser.(models.User)

	var req CreateGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.GameType == "random" {
		var waitingGame models.Game
		result := initializers.DB.Preload("Player1").Where("status = ? AND player2_id IS NULL", models.GameStatusWaiting).First(&waitingGame)
		
		if result.Error == nil && waitingGame.Player1ID != user.ID {
			waitingGame.Player2ID = &user.ID
			waitingGame.Status = models.GameStatusActive
			now := time.Now()
			waitingGame.StartedAt = &now
			
			if err := initializers.DB.Save(&waitingGame).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join game"})
				return
			}



			initializers.DB.Preload("Player1").Preload("Player2").First(&waitingGame, waitingGame.ID)

			response := GameResponse{
				GameID: waitingGame.GameID,
				Status: string(waitingGame.Status),
				Player1: UserInfo{
					ID:     waitingGame.Player1.ID,
					Name:   waitingGame.Player1.Name,
					Email:  waitingGame.Player1.Email,
					Avatar: waitingGame.Player1.Avatar,
				},
				Player2: &UserInfo{
					ID:     waitingGame.Player2.ID,
					Name:   waitingGame.Player2.Name,
					Email:  waitingGame.Player2.Email,
					Avatar: waitingGame.Player2.Avatar,
				},
				PlayerColor: "black",
				CreatedAt:   waitingGame.CreatedAt,
			}

			c.JSON(http.StatusOK, response)
			return
		}

		gameID := uuid.New().String()
		newGame := models.Game{
			GameID:    gameID,
			Player1ID: user.ID,
			Status:    models.GameStatusWaiting,
		}

		if err := initializers.DB.Create(&newGame).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create game"})
			return
		}



		initializers.DB.Preload("Player1").First(&newGame, newGame.ID)

		response := GameResponse{
			GameID: newGame.GameID,
			Status: string(newGame.Status),
			Player1: UserInfo{
				ID:     newGame.Player1.ID,
				Name:   newGame.Player1.Name,
				Email:  newGame.Player1.Email,
				Avatar: newGame.Player1.Avatar,
			},
			PlayerColor: "white",
			CreatedAt:   newGame.CreatedAt,
		}

		c.JSON(http.StatusOK, response)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid game type"})
	}
}

func JoinGame(c *gin.Context) {
	currentUser, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user := currentUser.(models.User)

	var req JoinGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var game models.Game
	result := initializers.DB.Preload("Player1").Where("game_id = ? AND status = ?", req.GameID, models.GameStatusWaiting).First(&game)
	
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game not found or not available"})
		return
	}

	if game.Player1ID == user.ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot join your own game"})
		return
	}

	if game.Player2ID != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Game is already full"})
		return
	}

	game.Player2ID = &user.ID
	game.Status = models.GameStatusActive
	now := time.Now()
	game.StartedAt = &now

	if err := initializers.DB.Save(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join game"})
		return
	}



	initializers.DB.Preload("Player1").Preload("Player2").First(&game, game.ID)

	response := GameResponse{
		GameID: game.GameID,
		Status: string(game.Status),
		Player1: UserInfo{
			ID:     game.Player1.ID,
			Name:   game.Player1.Name,
			Email:  game.Player1.Email,
			Avatar: game.Player1.Avatar,
		},
		Player2: &UserInfo{
			ID:     game.Player2.ID,
			Name:   game.Player2.Name,
			Email:  game.Player2.Email,
			Avatar: game.Player2.Avatar,
		},
		PlayerColor: "black",
		CreatedAt:   game.CreatedAt,
	}

	c.JSON(http.StatusOK, response)
}

func GetGame(c *gin.Context) {
	currentUser, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user := currentUser.(models.User)
	gameID := c.Param("gameId")

	var game models.Game
	result := initializers.DB.Preload("Player1").Preload("Player2").Where("game_id = ?", gameID).First(&game)
	
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game not found"})
		return
	}

	var playerColor string
	if game.Player1ID == user.ID {
		playerColor = "white"
	} else if game.Player2ID != nil && *game.Player2ID == user.ID {
		playerColor = "black"
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not part of this game"})
		return
	}

	response := GameResponse{
		GameID: game.GameID,
		Status: string(game.Status),
		Player1: UserInfo{
			ID:     game.Player1.ID,
			Name:   game.Player1.Name,
			Email:  game.Player1.Email,
			Avatar: game.Player1.Avatar,
		},
		PlayerColor: playerColor,
		CreatedAt:   game.CreatedAt,
	}

	if game.Player2 != nil {
		response.Player2 = &UserInfo{
			ID:     game.Player2.ID,
			Name:   game.Player2.Name,
			Email:  game.Player2.Email,
			Avatar: game.Player2.Avatar,
		}
	}

	c.JSON(http.StatusOK, response)
}

func UpdateGameState(gameID, fen, moves, currentTurn string, winner, endReason *string) error {
	updates := map[string]interface{}{
		"fen":          fen,
		"moves":        moves,
		"current_turn": currentTurn,
	}

	if winner != nil {
		updates["winner"] = *winner
		updates["status"] = models.GameStatusCompleted
		now := time.Now()
		updates["ended_at"] = &now
	}

	if endReason != nil {
		updates["end_reason"] = *endReason
	}

	return initializers.DB.Model(&models.Game{}).Where("game_id = ?", gameID).Updates(updates).Error
}

func GetGameFromDB(gameID string) (*models.Game, error) {
	var game models.Game
	err := initializers.DB.Preload("Player1").Preload("Player2").Where("game_id = ?", gameID).First(&game).Error
	if err != nil {
		return nil, err
	}
	return &game, nil
}
