import React, { useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import JoinGameModal from './JoinGameModal';
import GameCreatedModal from './GameCreatedModal';

const GameControls: React.FC = () => {
  const { gameState, connect, disconnect, joinGame, createGame, joinInvite, resetGame } = useGame();
  const [joinAfterConnect, setJoinAfterConnect] = useState(false);
  const [createAfterConnect, setCreateAfterConnect] = useState(false);
  const [joinInviteAfterConnect, setJoinInviteAfterConnect] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showGameCreatedModal, setShowGameCreatedModal] = useState(false);

  const handleConnect = () => {
    if (gameState.isConnected) {
      setJoinAfterConnect(false);
      setCreateAfterConnect(false);
      setJoinInviteAfterConnect(null);
      disconnect();
    } else {
      connect();
    }
  };

  const handleJoinGame = () => {
    if (!gameState.isConnected) {
      setJoinAfterConnect(true);
      connect();
    } else {
      joinGame();
    }
  };

  const handleCreateGame = () => {
    if (!gameState.isConnected) {
      setCreateAfterConnect(true);
      connect();
    } else {
      createGame();
    }
  };

  const handleJoinByCode = () => {
    setShowJoinModal(true);
  };

  const handleJoinWithGameId = (gameId: string) => {
    if (!gameState.isConnected) {
      setJoinInviteAfterConnect(gameId);
      connect();
    } else {
      joinInvite(gameId);
    }
  };

  useEffect(() => {
    if (joinAfterConnect && gameState.isConnected) {
      joinGame();
      setJoinAfterConnect(false);
    }
  }, [joinAfterConnect, gameState.isConnected, joinGame]);

  useEffect(() => {
    if (createAfterConnect && gameState.isConnected) {
      createGame();
      setCreateAfterConnect(false);
    }
  }, [createAfterConnect, gameState.isConnected, createGame]);

  useEffect(() => {
    if (joinInviteAfterConnect && gameState.isConnected) {
      joinInvite(joinInviteAfterConnect);
      setJoinInviteAfterConnect(null);
    }
  }, [joinInviteAfterConnect, gameState.isConnected, joinInvite]);

  useEffect(() => {
    if (gameState.createdGameId) {
      setShowGameCreatedModal(true);
    }
  }, [gameState.createdGameId]);

  // Close the GameCreatedModal when the game actually starts or createdGameId is cleared
  useEffect(() => {
    if (!gameState.createdGameId || (gameState.gameId && !gameState.isWaitingForPlayer)) {
      setShowGameCreatedModal(false);
    }
  }, [gameState.createdGameId, gameState.gameId, gameState.isWaitingForPlayer]);

  const getJoinButtonText = () => {
    if (joinAfterConnect && !gameState.isConnected) return 'Connecting...';
    if (!gameState.isConnected) return 'Connect & Join Game';
    if (gameState.isWaitingForMatch) return 'Waiting for opponent...';
    if (gameState.gameId) return 'Game in progress';
    return 'Join Game';
  };

  const isJoinDisabled = () => {
    return joinAfterConnect || joinInviteAfterConnect !== null || gameState.isWaitingForMatch || gameState.isWaitingForPlayer || (gameState.gameId !== null);
  };

  const getCreateGameButtonText = () => {
    if (createAfterConnect && !gameState.isConnected) return 'Connecting...';
    return 'Create Custom Game';
  };

  const isCreateGameDisabled = () => {
    return createAfterConnect || joinInviteAfterConnect !== null || gameState.isWaitingForMatch || gameState.isWaitingForPlayer || (gameState.gameId !== null);
  };

  const isJoinByCodeDisabled = () => {
    return joinAfterConnect || createAfterConnect || joinInviteAfterConnect !== null || gameState.isWaitingForMatch || gameState.isWaitingForPlayer || (gameState.gameId !== null);
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

        <div className="game-mode-buttons">
          <button
            onClick={handleJoinGame}
            disabled={isJoinDisabled()}
            className="control-button primary"
          >
            {getJoinButtonText()}
          </button>

          <button
            onClick={handleCreateGame}
            disabled={isCreateGameDisabled()}
            className="control-button secondary"
          >
            {getCreateGameButtonText()}
          </button>

          <button
            onClick={handleJoinByCode}
            disabled={isJoinByCodeDisabled()}
            className="control-button secondary"
          >
            Join Room
          </button>
        </div>

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

      {gameState.isWaitingForPlayer && (
        <div className="waiting-message">
          <div className="spinner"></div>
          <p>Waiting for your friend to join...</p>
        </div>
      )}

      <JoinGameModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinWithGameId}
      />

      <GameCreatedModal
        isOpen={showGameCreatedModal}
        gameId={gameState.createdGameId || ''}
        onClose={() => setShowGameCreatedModal(false)}
      />
    </div>
  );
};

export default GameControls;
