import React from 'react';
import { useGame } from '../../contexts/GameContext';

const GameControls: React.FC = () => {
  const { gameState, connect, disconnect, joinGame, resetGame } = useGame();

  const handleConnect = () => {
    if (gameState.isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const handleJoinGame = () => {
    if (!gameState.isConnected) {
      connect();
      // Join game after connection is established
      setTimeout(() => joinGame(), 1000);
    } else {
      joinGame();
    }
  };

  const getJoinButtonText = () => {
    if (!gameState.isConnected) return 'Connect & Join Game';
    if (gameState.isWaitingForMatch) return 'Waiting for opponent...';
    if (gameState.gameId) return 'Game in progress';
    return 'Join Game';
  };

  const isJoinDisabled = () => {
    return gameState.isWaitingForMatch || (gameState.gameId !== null);
  };

  return (
    <div className="game-controls">
      <div className="connection-status">
        <div className={`status-dot ${gameState.isConnected ? 'connected' : 'disconnected'}`}></div>
        <span>{gameState.isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      <div className="control-buttons">
        <button
          onClick={handleConnect}
          className={`control-button ${gameState.isConnected ? 'danger' : 'primary'}`}
        >
          {gameState.isConnected ? 'Disconnect' : 'Connect'}
        </button>

        <button
          onClick={handleJoinGame}
          disabled={isJoinDisabled()}
          className="control-button primary"
        >
          {getJoinButtonText()}
        </button>

        {(gameState.gameOver || gameState.gameId) && (
          <button
            onClick={resetGame}
            className="control-button secondary"
          >
            New Game
          </button>
        )}
      </div>

      {gameState.error && (
        <div className="error-display">
          <strong>Error:</strong> {gameState.error}
        </div>
      )}

      {gameState.isWaitingForMatch && (
        <div className="waiting-message">
          <div className="spinner"></div>
          <p>Looking for an opponent...</p>
        </div>
      )}
    </div>
  );
};

export default GameControls;
