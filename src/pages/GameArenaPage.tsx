import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import ChessBoard from '../components/Game/ChessBoard';
import GameInfo from '../components/Game/GameInfo';
import GameControls from '../components/Game/GameControls';
import { Crown, LogOut, Home, Settings, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const GameArenaPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#1a0f2e] to-slate-950">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <nav className="relative z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Crown className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">SuperChess</span>
              <span className="text-sm text-white/60 bg-white/10 px-2 py-1 rounded-full">Arena</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <User className="w-4 h-4 text-white/70" />
                <span className="text-white/90 text-sm font-medium">
                  {user?.email?.split('@')[0] || 'Player'}
                </span>
              </div>
              
              <Link
                to="/"
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">Home</span>
              </Link>
              
              <button
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-white/70 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Game Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Chess Board Section */}
          <div className="lg:col-span-2">
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Game Board</CardTitle>
                <Badge variant="success" className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Live</span>
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-[640px] sm:max-w-[560px] md:max-w-[640px] aspect-square">
                    <ChessBoard />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-white">Game Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <GameControls />
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-white">Game Info</CardTitle>
              </CardHeader>
              <CardContent>
                <GameInfo />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-3 rounded-full shadow-2xl hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-110">
          <Crown className="w-6 h-6" />
        </button>
      </div>

      {/* Removed inline style in favor of Tailwind utilities */}
    </div>
  );
};

export default GameArenaPage;
