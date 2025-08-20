import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { Badge } from '../ui/badge';

const GameInfo: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="space-y-4">
      {/* Game Status */}
      <div className="flex items-center justify-between">
        <span className="text-zinc-400">Status:</span>
        <Badge variant={gameState.gameOver ? "destructive" : "default"}>
          {gameState.gameOver ? 'Game Over' : 
           gameState.isWaitingForPlayer ? 'Waiting for opponent' :
           gameState.isWaitingForMatch ? 'Finding match...' :
           gameState.gameId ? 'Playing' : 'Disconnected'}
        </Badge>
      </div>

      {/* Player Color */}
      {gameState.playerColor && (
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Your Color:</span>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{gameState.playerColor === 'white' ? '♔' : '♚'}</span>
            <span className="text-zinc-200 capitalize">{gameState.playerColor}</span>
          </div>
        </div>
      )}

      {/* Current Turn */}
      {gameState.gameId && !gameState.gameOver && (
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Turn:</span>
          <div className="flex items-center space-x-2">
            <span className="text-xl">{gameState.turn === 'white' ? '♔' : '♚'}</span>
            <span className="text-zinc-200 capitalize">{gameState.turn}</span>
            {gameState.turn === gameState.playerColor && (
              <Badge variant="default" className="text-xs">Your turn</Badge>
            )}
          </div>
        </div>
      )}

      {/* Game ID */}
      {gameState.gameId && (
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Game ID:</span>
          <span className="text-zinc-200 font-mono text-sm">{gameState.gameId.substring(0, 8)}...</span>
        </div>
      )}

      {/* Winner */}
      {gameState.gameOver && gameState.winner && (
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Winner:</span>
          <div className="flex items-center space-x-2">
            <span className="text-xl">{gameState.winner === 'white' ? '♔' : '♚'}</span>
            <span className="text-zinc-200 capitalize">{gameState.winner}</span>
          </div>
        </div>
      )}

      {/* Game End Reason */}
      {gameState.gameOver && gameState.reason && (
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Reason:</span>
          <span className="text-zinc-200">{gameState.reason}</span>
        </div>
      )}

      {/* Move Count */}
      {gameState.moves.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Moves:</span>
          <span className="text-zinc-200">{Math.ceil(gameState.moves.length / 2)}</span>
        </div>
      )}
    </div>
  );
};

export default GameInfo;
