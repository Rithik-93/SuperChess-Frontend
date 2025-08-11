import React from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useGame } from '../../contexts/GameContext';

const ChessBoard: React.FC = () => {
  const { gameState, makeMove } = useGame();

  const onDrop = ({ sourceSquare, targetSquare }: { piece: { isSparePiece: boolean, position: string, pieceType: string }, sourceSquare: string, targetSquare: string | null }) => {
    // Check if target square exists
    if (!targetSquare) {
      return false;
    }

    // Check if it's the player's turn
    if (gameState.turn !== gameState.playerColor) {
      return false;
    }

    // Check if game is over
    if (gameState.gameOver) {
      return false;
    }

    // Convert coordinate notation to algebraic notation using chess.js
    try {
      const chess = new Chess(gameState.fen);
      // Check if this is a pawn promotion
      const piece = chess.get(sourceSquare as any);
      const isPromotion = piece?.type === 'p' &&
        ((piece.color === 'w' && targetSquare[1] === '8') ||
         (piece.color === 'b' && targetSquare[1] === '1'));
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? 'q' : undefined // Default to queen for promotion
      });
      
      if (!move) {
        return false; // Invalid move
      }
      
      // Send the algebraic notation (like "e4", "Nf3", "O-O", "e8=Q")
      makeMove(move.san);
    } catch (error) {
      console.error('Error converting move:', error);
      return false;
    }
    return true;
  };

  const boardOrientation = gameState.playerColor === 'black' ? 'black' : 'white';

  return (
    <div className="chess-board-container">
      <Chessboard
        options={{
          position: gameState.fen,
          onPieceDrop: onDrop,
          boardOrientation: boardOrientation,
          allowDragging: !gameState.gameOver && 
            gameState.turn === gameState.playerColor &&
            gameState.gameId !== null,
          boardStyle: {
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </div>
  );
};

export default ChessBoard;
