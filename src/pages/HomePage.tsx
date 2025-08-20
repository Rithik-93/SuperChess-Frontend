import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { gameState, connect, joinGame, createGame, joinInvite } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  // Connect on component mount if not connected
  React.useEffect(() => {
    if (!gameState.isConnected) {
      connect();
    }
  }, [gameState.isConnected, connect]);

  // Navigate to game when game is created/joined
  React.useEffect(() => {
    if (gameState.gameId) {
      navigate(`/game/${gameState.gameId}`);
    }
  }, [gameState.gameId, navigate]);

  const handleJoinRandomGame = () => {
    if (!gameState.isConnected) {
      connect();
      // Wait a bit for connection then join
      setTimeout(() => joinGame(), 500);
    } else {
      joinGame();
    }
  };

  const handleCreateGame = () => {
    if (!gameState.isConnected) {
      connect();
      setTimeout(() => createGame(), 500);
    } else {
      createGame();
    }
  };

  const handleJoinWithCode = () => {
    if (joinCode.trim()) {
      if (!gameState.isConnected) {
        connect();
        setTimeout(() => joinInvite(joinCode.trim()), 500);
      } else {
        joinInvite(joinCode.trim());
      }
      setJoinCode('');
    }
  };

  const getJoinButtonText = () => {
    if (gameState.isWaitingForMatch) return 'Waiting for opponent...';
    if (gameState.gameId) return 'Game in progress';
    if (!gameState.isConnected) return 'Connect & Find Match';
    return 'Find Match';
  };

  const getCreateButtonText = () => {
    if (gameState.isWaitingForPlayer) return 'Waiting for player...';
    if (gameState.gameId) return 'Game in progress';
    if (!gameState.isConnected) return 'Connect & Create Game';
    return 'Create Game';
  };

  const isJoinDisabled = () => {
    return gameState.isWaitingForMatch || gameState.isWaitingForPlayer || (gameState.gameId !== null);
  };

  const isCreateDisabled = () => {
    return gameState.isWaitingForMatch || gameState.isWaitingForPlayer || (gameState.gameId !== null);
  };

  const isJoinByCodeDisabled = () => {
    return gameState.isWaitingForMatch || gameState.isWaitingForPlayer || (gameState.gameId !== null);
  };

  return (
    <div className="w-full min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-8">
          <Link to="/">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              ChessMaster
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant={gameState.isConnected ? 'default' : 'destructive'}>
              <span className="inline-flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${gameState.isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                {gameState.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </Badge>
            <span className="text-zinc-400">Welcome, {user?.email?.split('@')[0] || 'Player'}</span>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Game Options */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">
            Choose your game mode
          </h2>
          <p className="text-zinc-400 text-lg">
            Select how you want to play chess today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Join Random Game */}
          <Card className="hover:bg-zinc-900/50 transition-colors cursor-pointer group">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-2xl font-bold text-zinc-100 mb-4">
                Random Match
              </h3>
              <p className="text-zinc-400 mb-6">
                Get matched with a player of similar skill level for a quick game
              </p>
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleJoinRandomGame}
                disabled={isJoinDisabled()}
              >
                {getJoinButtonText()}
              </Button>
            </CardContent>
          </Card>

          {/* Create Game */}
          <Card className="hover:bg-zinc-900/50 transition-colors cursor-pointer group">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
              <h3 className="text-2xl font-bold text-zinc-100 mb-4">
                Create Game
              </h3>
              <p className="text-zinc-400 mb-6">
                Create a private game and invite your friends to join
              </p>
              <Button 
                size="lg" 
                className="w-full" 
                variant="secondary"
                onClick={handleCreateGame}
                disabled={isCreateDisabled()}
              >
                {getCreateButtonText()}
              </Button>
            </CardContent>
          </Card>

          {/* Join Game */}
          <Card className="hover:bg-zinc-900/50 transition-colors group">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🔗</div>
              <h3 className="text-2xl font-bold text-zinc-100 mb-4">
                Join Game
              </h3>
              <p className="text-zinc-400 mb-6">
                Enter a game code to join a friend's private game
              </p>
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter game code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="text-center"
                />
                <Button 
                  size="lg" 
                  className="w-full" 
                  variant="outline"
                  onClick={handleJoinWithCode}
                  disabled={!joinCode.trim() || isJoinByCodeDisabled()}
                >
                  Join Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Messages */}
        {gameState.error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/15 text-red-200 p-3 text-sm mb-6 max-w-2xl mx-auto">
            <strong className="mr-1">Error:</strong> {gameState.error}
          </div>
        )}

        {gameState.isWaitingForMatch && (
          <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-white/80 text-sm text-center mb-6 max-w-2xl mx-auto">
            <div className="mx-auto mb-2 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Looking for an opponent...
          </div>
        )}

        {gameState.isWaitingForPlayer && (
          <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-white/80 text-sm text-center mb-6 max-w-2xl mx-auto">
            <div className="mx-auto mb-2 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Waiting for your friend to join...
            {gameState.createdGameId && (
              <div className="mt-2">
                <span className="text-emerald-400 font-mono">{gameState.createdGameId}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-zinc-100 mb-6">
            Your Stats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-zinc-900/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">1247</div>
              <div className="text-zinc-400 text-sm">Rating</div>
            </div>
            <div className="bg-zinc-900/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">23</div>
              <div className="text-zinc-400 text-sm">Games Won</div>
            </div>
            <div className="bg-zinc-900/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">15</div>
              <div className="text-zinc-400 text-sm">Games Lost</div>
            </div>
            <div className="bg-zinc-900/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">5</div>
              <div className="text-zinc-400 text-sm">Draws</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
