import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-black transition-colors duration-200 flex-col p-4 gap-8">
      <div className="text-center text-gray-100 p-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            ChessMaster
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-2">
            Master the game of kings
          </p>
          <p className="text-gray-400 text-lg">
            Play chess online with players from around the world
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-zinc-100 mb-6">
                Ready to play?
              </h2>

              {user ? (
                <Link to="/home" className="block">
                  <Button size="lg" className="w-full">
                    Start Playing
                  </Button>
                </Link>
              ) : (
                <Link to="/login" className="block">
                  <Button size="lg" className="w-full">
                    Start Playing
                  </Button>
                </Link>
              )}

              <div className="text-center text-zinc-400 text-sm">
                Join thousands of players online
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-lg font-medium text-zinc-200 mb-1">
              Fast Games
            </h3>
            <p className="text-zinc-400 text-sm">
              Quick matches with time controls
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="text-lg font-medium text-zinc-200 mb-1">
              Ranked Play
            </h3>
            <p className="text-zinc-400 text-sm">
              Climb the leaderboards
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="text-lg font-medium text-zinc-200 mb-1">
              Private Games
            </h3>
            <p className="text-zinc-400 text-sm">
              Play with friends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;