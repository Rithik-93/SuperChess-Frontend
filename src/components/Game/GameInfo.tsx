import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

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
    <div className="space-y-4 text-white/90">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={getStatusColor() === 'success' ? 'success' : getStatusColor() === 'danger' ? 'destructive' : getStatusColor() === 'warning' ? 'warning' : 'secondary'}>
          {getTurnText()}
        </Badge>
        {gameState.inCheck && !gameState.gameOver && <Badge variant="destructive">Check!</Badge>}
      </div>

      <div className="space-y-1">
        <div>
          Playing as: <span className="font-semibold capitalize">{gameState.playerColor || 'Not assigned'}</span>
        </div>
        {gameState.gameId && (
          <div className="text-sm text-white/70">
            Game ID: <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md">{gameState.gameId}</span>
          </div>
        )}
      </div>

      {gameState.moves.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Move History</h4>
          <ScrollArea className="max-h-56">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono text-white/80">
              {gameState.moves.map((move, index) => (
                <div key={index} className="">
                  {Math.floor(index / 2) + 1}
                  {index % 2 === 0 ? '.' : '...'} {move}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default GameInfo;
