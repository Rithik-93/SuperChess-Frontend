import React, { useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import JoinGameModal from './JoinGameModal';
import GameCreatedModal from './GameCreatedModal';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={gameState.isConnected ? 'success' : 'destructive'}>
          <span className="inline-flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${gameState.isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            {gameState.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </Badge>
        {gameState.isWaitingForMatch && (
          <Badge variant="warning">Matching...</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Button onClick={handleConnect} variant={gameState.isConnected ? 'destructive' : 'default'}>
          {gameState.isConnected ? 'Disconnect' : 'Connect'}
        </Button>

        <Button onClick={handleJoinGame} disabled={isJoinDisabled()}>
          {getJoinButtonText()}
        </Button>

        <Button onClick={handleCreateGame} disabled={isCreateGameDisabled()} variant="secondary">
          {getCreateGameButtonText()}
        </Button>

        <Button onClick={handleJoinByCode} disabled={isJoinByCodeDisabled()} variant="outline">
          Join Room
        </Button>
      </div>

      {(gameState.gameOver || gameState.gameId) && (
        <Button onClick={resetGame} variant="secondary">
          New Game
        </Button>
      )}

      {gameState.error && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/15 text-red-200 p-3 text-sm">
          <strong className="mr-1">Error:</strong> {gameState.error}
        </div>
      )}

      {gameState.isWaitingForMatch && (
        <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-white/80 text-sm text-center">
          <div className="mx-auto mb-2 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Looking for an opponent...
        </div>
      )}

      {gameState.isWaitingForPlayer && (
        <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-white/80 text-sm text-center">
          <div className="mx-auto mb-2 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Waiting for your friend to join...
        </div>
      )}

      <JoinGameModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} onJoin={handleJoinWithGameId} />

      <GameCreatedModal
        isOpen={showGameCreatedModal}
        gameId={gameState.createdGameId || ''}
        onClose={() => setShowGameCreatedModal(false)}
      />
    </div>
  );
};

export default GameControls;
