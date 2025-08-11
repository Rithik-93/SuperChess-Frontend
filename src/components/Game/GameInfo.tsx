import React from 'react';
import { useGame } from '../../contexts/GameContext';

const GameInfo: React.FC = () => {
  const { gameState } = useGame();

  const getTurnText = () => {
    if (gameState.gameOver) {
      if (gameState.winner) {
        const winnerText = gameState.winner === gameState.playerColor ? 'You won!' : 'You lost!';
        return `${winnerText} ${gameState.reason ? `(${gameState.reason})` : ''}`;
      }
      return `Game ended in a draw ${gameState.reason ? `(${gameState.reason})` : ''}`;
    }

    if (gameState.turn === gameState.playerColor) {
      return "Your turn";
    } else {
      return "Opponent's turn";
    }
  };

  const getStatusColor = () => {
    if (gameState.gameOver) {
      if (gameState.winner === gameState.playerColor) return 'success';
      if (gameState.winner) return 'danger';
      return 'warning';
    }
    if (gameState.turn === gameState.playerColor) return 'primary';
    return 'secondary';
  };

  return (
    <div className="game-info">
      <div className="game-status">
        <div className={`status-indicator ${getStatusColor()}`}>
          {getTurnText()}
        </div>
        
        {gameState.inCheck && !gameState.gameOver && (
          <div className="check-indicator">
            Check!
          </div>
        )}
      </div>

      <div className="player-info">
        <div className="player-color">
          Playing as: <strong>{gameState.playerColor || 'Not assigned'}</strong>
        </div>
        {gameState.gameId && (
          <div className="game-id">
            Game ID: <code>{gameState.gameId}</code>
          </div>
        )}
      </div>

      {gameState.moves.length > 0 && (
        <div className="move-history">
          <h4>Move History</h4>
          <div className="moves-list">
            {gameState.moves.map((move, index) => (
              <span key={index} className="move">
                {Math.floor(index / 2) + 1}
                {index % 2 === 0 ? '.' : '...'} {move}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameInfo;
