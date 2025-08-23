package main

import (
	"encoding/json"
	"time"

	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
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
		return string(ColorWhite)
	}
	return string(ColorBlack)
}

func (g *Game) isPlayerTurn(playerID uint) bool {
	currentTurn := g.getCurrentTurn()
	if currentTurn == string(ColorWhite) && g.Player1 != nil && g.Player1.ID == playerID {
		return true
	}
	if currentTurn == string(ColorBlack) && g.Player2 != nil && g.Player2.ID == playerID {
		return true
	}
	return false
}

func (g *Game) isPositionInCheck() bool {
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

	// Add timer information if available
	if g.Timer != nil {
		stateData.WhiteTime = int64(g.Timer.WhiteTime.Milliseconds())
		stateData.BlackTime = int64(g.Timer.BlackTime.Milliseconds())
	}

	if g.ChessGame.Outcome() != chess.NoOutcome {
		stateData.GameOver = true
		switch g.ChessGame.Outcome() {
		case chess.WhiteWon:
			stateData.Winner = string(ColorWhite)
			stateData.Reason = g.ChessGame.Method().String()
		case chess.BlackWon:
			stateData.Winner = string(ColorBlack)
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

func (g *Game) sendStateToPlayer(player *Player) {
	if player == nil || player.Conn == nil {
		return
	}

	stateData := GameStateData{
		GameID:   g.ID,
		FEN:      g.ChessGame.FEN(),
		Board:    g.getBoardArray(),
		Turn:     g.getCurrentTurn(),
		Moves:    convertMovesToStrings(g.ChessGame.Moves()),
		InCheck:  g.isPositionInCheck(),
		GameOver: g.ChessGame.Outcome() != chess.NoOutcome,
	}

	// Add timer information if available
	if g.Timer != nil {
		stateData.WhiteTime = int64(g.Timer.WhiteTime.Milliseconds())
		stateData.BlackTime = int64(g.Timer.BlackTime.Milliseconds())
	}

	if g.ChessGame.Outcome() != chess.NoOutcome {
		stateData.GameOver = true
		switch g.ChessGame.Outcome() {
		case chess.WhiteWon:
			stateData.Winner = string(ColorWhite)
			stateData.Reason = g.ChessGame.Method().String()
		case chess.BlackWon:
			stateData.Winner = string(ColorBlack)
			stateData.Reason = g.ChessGame.Method().String()
		case chess.Draw:
			stateData.Reason = g.ChessGame.Method().String()
		}
	}

	msg := Message{Type: MsgTypeState}
	data, _ := json.Marshal(stateData)
	msg.Data = data
	msgBytes, _ := json.Marshal(msg)

	player.Conn.WriteMessage(websocket.TextMessage, msgBytes)
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

func sendPlayerInfo(player *Player, gameID, color string) {
	if player == nil || player.Conn == nil {
		return
	}

	playerInfoData := PlayerInfoData{
		PlayerID: player.ID,
		Color:    color,
		GameID:   gameID,
	}

	msg := Message{Type: MsgTypePlayerInfo}
	data, _ := json.Marshal(playerInfoData)
	msg.Data = data
	msgBytes, _ := json.Marshal(msg)

	player.Conn.WriteMessage(websocket.TextMessage, msgBytes)
}

func sendGameCreated(player *Player, gameID string) {
	if player == nil || player.Conn == nil {
		return
	}

	gameCreatedData := GameCreatedData{
		GameID: gameID,
	}

	msg := Message{Type: MsgTypeGameCreated}
	data, _ := json.Marshal(gameCreatedData)
	msg.Data = data
	msgBytes, _ := json.Marshal(msg)

	player.Conn.WriteMessage(websocket.TextMessage, msgBytes)
}

func sendErrorToPlayer(player *Player, errorMsg string) {
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

// Timer-related functions

// startTimer initializes and starts the game timer
func (g *Game) startTimer(initialTime, increment time.Duration) {
	if g.Timer == nil {
		g.Timer = &GameTimer{
			WhiteTime: initialTime,
			BlackTime: initialTime,
			Increment: increment,
			IsActive:  true,
			StopChan:  make(chan bool),
		}
	} else {
		g.Timer.WhiteTime = initialTime
		g.Timer.BlackTime = initialTime
		g.Timer.Increment = increment
		g.Timer.IsActive = true
	}

	go g.runTimer()
}

// stopTimer stops the game timer
func (g *Game) stopTimer() {
	if g.Timer != nil {
		g.Timer.IsActive = false
		select {
		case g.Timer.StopChan <- true:
		default:
		}
	}
}

// runTimer runs the main timer loop
func (g *Game) runTimer() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if !g.Timer.IsActive {
				return
			}
			g.updateTimer()
		case <-g.Timer.StopChan:
			return
		}
	}
}

// updateTimer updates the timer and checks for time up
func (g *Game) updateTimer() {
	g.Timer.Mutex.Lock()
	defer g.Timer.Mutex.Unlock()

	currentTurn := g.getCurrentTurn()
	
	if currentTurn == string(ColorWhite) {
		g.Timer.WhiteTime -= time.Second
		if g.Timer.WhiteTime <= 0 {
			g.handleTimeUp(string(ColorWhite))
			return
		}
	} else {
		g.Timer.BlackTime -= time.Second
		if g.Timer.BlackTime <= 0 {
			g.handleTimeUp(string(ColorBlack))
			return
		}
	}

	g.sendTimerUpdate()
}

// handleTimeUp handles when a player runs out of time
func (g *Game) handleTimeUp(loser string) {
	g.Timer.IsActive = false
	
	winner := ColorBlack
	if loser == string(ColorBlack) {
		winner = ColorWhite
	}

	switch loser {
	case string(ColorWhite):
		g.ChessGame.Resign(chess.White)
	case string(ColorBlack):
		g.ChessGame.Resign(chess.Black)
	}	

	timeUpData := TimeUpData{
		GameID: g.ID,
		Loser:  loser,
		Winner: string(winner),
		Reason: "Time up",
	}

	msg := Message{Type: MsgTypeTimeUp}
	data, _ := json.Marshal(timeUpData)
	msg.Data = data
	msgBytes, _ := json.Marshal(msg)

	if g.Player1 != nil && g.Player1.Conn != nil {
		g.Player1.Conn.WriteMessage(websocket.TextMessage, msgBytes)
	}
	if g.Player2 != nil && g.Player2.Conn != nil {
		g.Player2.Conn.WriteMessage(websocket.TextMessage, msgBytes)
	}

	winnerStr := string(winner)
	updateGameStateInDB(g.ID, g.ChessGame.FEN(), "", g.getCurrentTurn(), &winnerStr, &timeUpData.Reason)
}

// sendTimerUpdate sends current timer state to all players
func (g *Game) sendTimerUpdate() {
	if g.Timer == nil {
		return
	}

	timerData := TimerData{
		GameID:      g.ID,
		WhiteTime:   int64(g.Timer.WhiteTime.Milliseconds()),
		BlackTime:   int64(g.Timer.BlackTime.Milliseconds()),
		CurrentTurn: g.getCurrentTurn(),
	}

	msg := Message{Type: MsgTypeTimerUpdate}
	data, _ := json.Marshal(timerData)
	msg.Data = data
	msgBytes, _ := json.Marshal(msg)

	if g.Player1 != nil && g.Player1.Conn != nil {
		g.Player1.Conn.WriteMessage(websocket.TextMessage, msgBytes)
	}
	if g.Player2 != nil && g.Player2.Conn != nil {
		g.Player2.Conn.WriteMessage(websocket.TextMessage, msgBytes)
	}
}

// addTime adds increment time to the player who just moved
func (g *Game) addTime(playerColor string) {
	if g.Timer == nil || g.Timer.Increment <= 0 {
		return
	}

	g.Timer.Mutex.Lock()
	defer g.Timer.Mutex.Unlock()

	if playerColor == string(ColorWhite) {
		g.Timer.WhiteTime += g.Timer.Increment
	} else {
		g.Timer.BlackTime += g.Timer.Increment
	}
}

