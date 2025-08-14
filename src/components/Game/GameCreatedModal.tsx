import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface GameCreatedModalProps {
  isOpen: boolean;
  gameId: string;
  onClose: () => void;
}

const GameCreatedModal: React.FC<GameCreatedModalProps> = ({ isOpen, gameId, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy game ID:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg bg-white/10" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Game Created!</CardTitle>
          <button onClick={onClose} className="text-white/70 hover:text-white">×</button>
        </CardHeader>
        <CardContent>
          <p className="text-white/90">Share this Game ID with your friend to join:</p>
          <div className="flex gap-2 my-4">
            <input
              type="text"
              value={gameId}
              readOnly
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none"
            />
            <Button onClick={handleCopy} title="Copy to clipboard" variant={copied ? 'secondary' : 'default'}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-sm text-white/70">Waiting for your friend to join...</p>
          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>Got it!</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameCreatedModal;
