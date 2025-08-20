import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const GameControls: React.FC = () => {
  const { gameState, joinInvite, resetGame } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  const handleJoinGame = () => {
    if (!gameState.isConnected) return;
    navigate('/random-match');
  };

  const handleCreateGame = () => {
    if (!gameState.isConnected) return;
    navigate('/create-game');
  };

  const handleJoinWithCode = () => {
    if (joinCode.trim() && gameState.isConnected) {
      joinInvite(joinCode.trim());
      setJoinCode('');
    }
  };

  const handleNewGame = () => {
    resetGame();
  };

  // If no active game, show game selection
  if (!gameState.gameId && !gameState.isWaitingForMatch && !gameState.isWaitingForPlayer) {
    return (
      <div className="space-y-4">
        <Button 
          onClick={handleJoinGame} 
          className="w-full"
          disabled={!gameState.isConnected}
        >
          {gameState.isConnected ? 'Find Random Match' : 'Connecting...'}
        </Button>
        
        <Button 
          onClick={handleCreateGame} 
          variant="secondary" 
          className="w-full"
          disabled={!gameState.isConnected}
        >
          Create Private Game
        </Button>

        <div className="pt-4 border-t border-zinc-800">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Join with code:</label>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter game code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleJoinWithCode}
                disabled={!joinCode.trim() || !gameState.isConnected}
                size="sm"
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If waiting for match or player
  if (gameState.isWaitingForMatch || gameState.isWaitingForPlayer) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-md">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-emerald-400 text-sm">
            {gameState.isWaitingForMatch ? 'Finding opponent...' : 'Waiting for player to join...'}
          </p>
        </div>
        
        <Button 
          onClick={handleNewGame} 
          variant="ghost" 
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    );
  }

  // If game is active or finished
  return (
    <div className="space-y-4">
      {!gameState.gameOver && (
        <>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            disabled
          >
            Offer Draw
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full"
            disabled
          >
            Resign
          </Button>
        </>
      )}
      
      <Button 
        onClick={handleNewGame} 
        variant="secondary" 
        className="w-full"
      >
        {gameState.gameOver ? 'New Game' : 'Leave Game'}
      </Button>
    </div>
  );
};

export default GameControls;
