import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { ScrollArea } from '../ui/scroll-area';

const MoveHistory: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState.moves || gameState.moves.length === 0) {
    return (
      <div className="text-center text-zinc-500 text-sm py-4">
        No moves yet
      </div>
    );
  }

  const movePairs = [];
  for (let i = 0; i < gameState.moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: gameState.moves[i],
      black: gameState.moves[i + 1] || null
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-zinc-100">Moves</h3>
      
      <ScrollArea className="h-48">
        <div className="space-y-1 text-sm">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 text-zinc-400 text-xs font-medium pb-2 border-b border-zinc-800">
            <span>#</span>
            <span>White</span>
            <span>Black</span>
          </div>
          
          {/* Move pairs */}
          {movePairs.map((pair) => (
            <div key={pair.number} className="grid grid-cols-3 gap-2 text-zinc-200 py-1">
              <span className="text-zinc-400">{pair.number}.</span>
              <span className="font-mono">{pair.white}</span>
              <span className="font-mono">{pair.black || '-'}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MoveHistory;