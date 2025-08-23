import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface ChessTimerProps {
  className?: string;
}

const ChessTimer: React.FC<ChessTimerProps> = ({ className }) => {
  const { gameState } = useGame();
  const [whiteTime, setWhiteTime] = useState<number | undefined>(gameState.whiteTime);
  const [blackTime, setBlackTime] = useState<number | undefined>(gameState.blackTime);

  useEffect(() => {
    if (gameState.whiteTime !== undefined) {
      setWhiteTime(gameState.whiteTime);
    }
    if (gameState.blackTime !== undefined) {
      setBlackTime(gameState.blackTime);
    }
  }, [gameState.whiteTime, gameState.blackTime]);

  useEffect(() => {
    if (!gameState.gameId || gameState.gameOver || !whiteTime || !blackTime) {
      return;
    }

    const interval = setInterval(() => {
      if (gameState.turn === 'white' && whiteTime > 0) {
        setWhiteTime(prev => prev ? prev - 1000 : prev);
      } else if (gameState.turn === 'black' && blackTime > 0) {
        setBlackTime(prev => prev ? prev - 1000 : prev);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.turn, gameState.gameId, gameState.gameOver, whiteTime, blackTime]);

  const formatTime = (timeMs: number | undefined): string => {
    if (timeMs === undefined || timeMs <= 0) return '00:00';
    
    const totalSeconds = Math.ceil(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (timeMs: number | undefined, isCurrentTurn: boolean): string => {
    if (timeMs === undefined) return 'text-zinc-400';
    if (timeMs <= 10000) return 'text-red-500';
    if (timeMs <= 30000) return 'text-yellow-500';
    if (isCurrentTurn) return 'text-emerald-400';
    return 'text-zinc-200';
  };

  const isWhiteTurn = gameState.turn === 'white';
  const isBlackTurn = gameState.turn === 'black';

  if (!gameState.gameId || !whiteTime || !blackTime) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-zinc-100">
          Chess Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* White Player Timer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">♔</span>
              <span className="text-zinc-200 font-medium">White</span>
              {gameState.playerColor === 'white' && (
                <Badge variant="default" className="text-xs">You</Badge>
              )}
            </div>
            {isWhiteTurn && (
              <Badge variant="secondary" className="text-xs">Thinking</Badge>
            )}
          </div>
          <div className={`text-3xl font-mono font-bold ${getTimeColor(whiteTime, isWhiteTurn)}`}>
            {formatTime(whiteTime)}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-700"></div>

        {/* Black Player Timer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">♚</span>
              <span className="text-zinc-200 font-medium">Black</span>
              {gameState.playerColor === 'black' && (
                <Badge variant="default" className="text-xs">You</Badge>
              )}
            </div>
            {isBlackTurn && (
              <Badge variant="secondary" className="text-xs">Thinking</Badge>
            )}
          </div>
          <div className={`text-3xl font-mono font-bold ${getTimeColor(blackTime, isBlackTurn)}`}>
            {formatTime(blackTime)}
          </div>
        </div>

        {/* Game Info */}
        <div className="pt-2 border-t border-zinc-700">
          <div className="text-xs text-zinc-400 text-center">
            <div>10 min + 5 sec increment</div>
            <div className="mt-1">
              {gameState.gameOver ? 'Game finished' : `${gameState.turn}'s turn`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChessTimer;
