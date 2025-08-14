import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (gameId: string) => void;
}

const JoinGameModal: React.FC<JoinGameModalProps> = ({ isOpen, onClose, onJoin }) => {
  const [gameId, setGameId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameId.trim()) {
      onJoin(gameId.trim());
      setGameId('');
      onClose();
    }
  };

  const handleClose = () => {
    setGameId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
      <Card className="w-full max-w-lg bg-white/10" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Join Game Room</CardTitle>
          <button onClick={handleClose} className="text-white/70 hover:text-white">×</button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="gameId" className="block text-sm font-medium text-white/90 mb-2">Game ID</label>
              <input
                type="text"
                id="gameId"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="Enter game ID to join"
                autoFocus
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={handleClose} variant="secondary">Cancel</Button>
              <Button type="submit">Join Game</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGameModal;
