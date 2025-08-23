import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useGame } from '../contexts/GameContext';

const CreateGamePage: React.FC = () => {
  const [gameSettings, setGameSettings] = useState({
    timeControl: '10+0',
    gameType: 'blitz',
    color: 'random'
  });
  const [gameCode] = useState('ABC123'); // In real app, this would be generated
  const [showGameCode, setShowGameCode] = useState(false);
  const { createGame, gameState } = useGame();


  const handleCreateGame = () => {
    createGame();
    setShowGameCode(true);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  React.useEffect(() => {
    if (gameState.createdGameId && gameState.isWaitingForPlayer) {
      setShowGameCode(true);
    }
  }, [gameState.createdGameId, gameState.isWaitingForPlayer]);

  return (
    <div className="w-full min-h-screen bg-black p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <Link to="/home" className="inline-block mb-6">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              ChessMaster
            </h1>
          </Link>
          <p className="text-xl text-gray-300">
            Create a private game
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-zinc-100 mb-6">
              Game Settings
            </h2>

            <div className="space-y-6">
              {/* Time Control */}
              <div>
                <label className="block text-zinc-200 font-medium mb-3">
                  Time Control
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['5+0', '10+0', '15+10', '30+0'].map((time) => (
                    <button
                      key={time}
                      onClick={() =>
                        setGameSettings({ ...gameSettings, timeControl: time })
                      }
                      className={`p-3 rounded-md border transition-colors ${
                        gameSettings.timeControl === time
                          ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                          : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Game Button */}
              <div className="pt-4">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCreateGame}
                  disabled={gameState.isWaitingForPlayer}
                >
                  {gameState.isWaitingForPlayer ? 'Game Created' : 'Create Game'}
                </Button>
              </div>

              {/* Game Code Display */}
              {(showGameCode || gameState.createdGameId) && (
                <div className="text-center pt-4 border-t border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-2">
                    Share this code with your friend:
                  </p>
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-md p-3">
                    <span className="text-2xl font-mono text-emerald-400 tracking-wider">
                      {gameState.createdGameId || gameCode}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={handleCopyCode}
                  >
                    Copy Code
                  </Button>
                  
                  {gameState.isWaitingForPlayer && (
                    <div className="mt-4 p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-md">
                      <p className="text-emerald-400 text-sm">
                        Waiting for your friend to join...
                      </p>
                      <div className="mt-2">
                        <div className="animate-spin w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link to="/home">
            <Button variant="ghost">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateGamePage;