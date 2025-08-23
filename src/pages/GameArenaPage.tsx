import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ChessBoard from '../components/Game/ChessBoard';
import MoveHistory from '../components/Game/MoveHistory';
import PlayerProfile from '../components/chess/PlayerProfile';
import ChessTimer from '../components/Game/ChessTimer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';



const GameInfo: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="space-y-4">
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
    </div>
  );
};

// Inline GameControls Component
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

const GameArenaPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { gameState, connect } = useGame();
  const { gameId } = useParams();

  React.useEffect(() => {
    if (gameId && !gameState.isConnected) {
      connect(gameId);
    } else if (!gameId && !gameState.isConnected) {
      connect();
    }
  }, [gameId, gameState.isConnected]);

  const handleExitGame = () => {
    logout();
  };

  // Mock opponent data - in real app this would come from game state
  const opponent = {
    name: gameState.gameId ? "ChessGrandmaster" : "Waiting...",
    rating: 1456,
    timeRemaining: "09:23"
  };

  const currentPlayer = {
    name: user?.email?.split('@')[0] || "You",
    rating: 1247,
    timeRemaining: "10:45"
  };

  return (
    <div className="w-full min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/home">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              ChessMaster
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            {gameState.gameId && (
              <div className="text-zinc-400 text-sm">
                Game ID:{" "}
                <span className="text-zinc-200 font-mono">
                  {gameState.gameId.substring(0, 8)}...
                </span>
              </div>
            )}
            <Button variant="ghost" onClick={handleExitGame}>
              Exit Game
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Opponent */}
          <div className="lg:col-span-1 space-y-4">
            <PlayerProfile
              name={opponent.name}
              rating={opponent.rating}
              timeRemaining={gameState.gameId ? opponent.timeRemaining : undefined}
              color={gameState.playerColor === 'white' ? 'black' : gameState.playerColor === 'black' ? 'white' : undefined}
              isOnline={!!gameState.gameId}
            />

            {/* Game Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-zinc-100">
                  Game Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GameInfo />
              </CardContent>
            </Card>

            {/* Move History */}
            <Card>
              <CardContent className="p-4">
                <MoveHistory />
              </CardContent>
            </Card>
          </div>

          {/* Center - Chess Board */}
          <div className="lg:col-span-2 flex items-center justify-center">
            <div className="text-center w-full">
              {gameState.isWaitingForPlayer && (
                <div className="mb-4">
                  <div className="text-zinc-400 mb-2">
                    Waiting for opponent...
                  </div>
                  <div className="animate-spin w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto"></div>
                </div>
              )}
              
              <div className="w-full max-w-[600px] mx-auto aspect-square">
                <ChessBoard />
              </div>
              
              <div className="mt-4 text-zinc-400 text-sm">
                {gameState.gameOver && "Game finished"}
                {gameState.isWaitingForPlayer && "Waiting for opponent"}
                {gameState.isWaitingForMatch && "Finding match..."}
                {gameState.gameId && !gameState.gameOver && !gameState.isWaitingForPlayer && 
                  (gameState.turn === gameState.playerColor ? "Your turn" : "Opponent's turn")}
                {!gameState.gameId && !gameState.isWaitingForMatch && !gameState.isWaitingForPlayer && "Ready to play"}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Current Player */}
          <div className="lg:col-span-1 space-y-4">
            <PlayerProfile
              name={currentPlayer.name}
              rating={currentPlayer.rating}
              timeRemaining={gameState.gameId ? currentPlayer.timeRemaining : undefined}
              isCurrentPlayer={true}
              color={gameState.playerColor as 'white' | 'black' | undefined}
              isOnline={true}
            />

            {/* Chess Timer */}
            {gameState.gameId && (
              <ChessTimer />
            )}

            {/* Game Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-zinc-100">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GameControls />
              </CardContent>
            </Card>

            {/* Chat - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-zinc-100">
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm max-h-32 overflow-y-auto mb-3">
                  <div className="text-zinc-400">
                    <span className="font-medium">System:</span>{" "}
                    Welcome to ChessMaster!
                  </div>
                  {gameState.gameId && (
                    <div className="text-zinc-500">
                      <span className="font-medium">System:</span>{" "}
                      Game started. Good luck!
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder:text-zinc-500"
                    disabled
                  />
                  <Button size="sm" className="px-3" disabled>
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameArenaPage;
