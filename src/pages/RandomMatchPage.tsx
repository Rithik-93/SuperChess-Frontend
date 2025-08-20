import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useGame } from '../contexts/GameContext';

const RandomMatchPage: React.FC = () => {
  const [status, setStatus] = useState<'searching' | 'found' | 'connecting'>('searching');
  const [searchTime, setSearchTime] = useState(0);
  const { gameState, joinGame, resetGame } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    // Start searching for a match
    joinGame();
    
    const timer = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [joinGame]);

  useEffect(() => {
    if (gameState.gameId) {
      setStatus('found');
      setTimeout(() => {
        setStatus('connecting');
        setTimeout(() => {
          navigate(`/game/${gameState.gameId}`);
        }, 2000);
      }, 1500);
    }
  }, [gameState.gameId, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    resetGame();
    navigate('/home');
  };

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
        </div>

        <Card className="text-center">
          <CardContent className="p-8">
            {status === 'searching' && (
              <>
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-4 border-emerald-400/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h2 className="text-2xl font-semibold text-zinc-100 mb-2">
                    Searching for opponent...
                  </h2>
                  <p className="text-zinc-400">
                    Finding the perfect match for you
                  </p>
                </div>

                <div className="mb-6">
                  <div className="text-3xl font-mono text-emerald-400 mb-2">
                    {formatTime(searchTime)}
                  </div>
                  <div className="text-zinc-500 text-sm">
                    Search time
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-md">
                    <span className="text-zinc-300">Time Control:</span>
                    <span className="text-zinc-100">10+0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-md">
                    <span className="text-zinc-300">Game Type:</span>
                    <span className="text-zinc-100">Blitz</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-md">
                    <span className="text-zinc-300">Rating Range:</span>
                    <span className="text-zinc-100">1200-1300</span>
                  </div>
                </div>
              </>
            )}

            {status === 'found' && (
              <>
                <div className="mb-6">
                  <div className="text-4xl mb-4">🎯</div>
                  <h2 className="text-2xl font-semibold text-zinc-100 mb-2">
                    Opponent Found!
                  </h2>
                  <p className="text-zinc-400">
                    Matched with ChessPlayer2024
                  </p>
                </div>

                <div className="mb-6 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-md">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-black font-bold">
                      C
                    </div>
                    <div>
                      <div className="text-zinc-100 font-medium">
                        ChessPlayer2024
                      </div>
                      <div className="text-zinc-400 text-sm">
                        Rating: 1278
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {status === 'connecting' && (
              <>
                <div className="mb-6">
                  <div className="text-4xl mb-4">🔗</div>
                  <h2 className="text-2xl font-semibold text-zinc-100 mb-2">
                    Connecting to game...
                  </h2>
                  <p className="text-zinc-400">
                    Setting up the chess board
                  </p>
                </div>

                <div className="w-8 h-8 mx-auto border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              </>
            )}

            <Button
              variant="ghost"
              onClick={handleCancel}
              className="mt-6"
            >
              Cancel Search
            </Button>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-zinc-500 text-sm">
            Average wait time: 15 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default RandomMatchPage;
