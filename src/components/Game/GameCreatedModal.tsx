import React, { useState } from 'react';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Game Created!</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p>Share this Game ID with your friend to join:</p>
          
          <div className="game-id-display">
            <input
              type="text"
              value={gameId}
              readOnly
              className="game-id-input"
            />
            <button 
              onClick={handleCopy}
              className="copy-button"
              title="Copy to clipboard"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          
          <p className="waiting-text">Waiting for your friend to join...</p>
          
          <div className="modal-actions">
            <button onClick={onClose} className="control-button primary">
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCreatedModal;
