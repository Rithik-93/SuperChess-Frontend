package main

import (
	"encoding/json"

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