import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface PlayerProfileProps {
  name: string;
  rating?: number;
  timeRemaining?: string;
  isCurrentPlayer?: boolean;
  color?: 'white' | 'black';
  isOnline?: boolean;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({
  name,
  rating,
  timeRemaining,
  isCurrentPlayer = false,
  color,
  isOnline = true
}) => {
  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          {/* Avatar/Color indicator */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${
            color === 'white' 
              ? 'bg-white/20 text-white' 
              : color === 'black' 
                ? 'bg-zinc-800 text-white border border-zinc-600'
                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-black'
          }`}>
            {color === 'white' ? '♔' : color === 'black' ? '♚' : name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-zinc-100 font-medium truncate">
                {name}
              </h3>
              {isCurrentPlayer && (
                <Badge variant="default" className="text-xs">You</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mt-1">
              {rating && (
                <span className="text-zinc-400 text-sm">
                  Rating: {rating}
                </span>
              )}
              
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="text-zinc-500 text-xs">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Time remaining */}
          {timeRemaining && (
            <div className="text-right">
              <div className="text-zinc-100 font-mono text-lg">
                {timeRemaining}
              </div>
              <div className="text-zinc-500 text-xs">
                Time left
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerProfile;