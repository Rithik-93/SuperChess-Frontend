import React, { useState } from 'react';

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
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Join Game Room</h3>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="gameId">Game ID</label>
            <input
              type="text"
              id="gameId"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter game ID to join"
              autoFocus
              required
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="control-button secondary">
              Cancel
            </button>
            <button type="submit" className="control-button primary">
              Join Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGameModal;
