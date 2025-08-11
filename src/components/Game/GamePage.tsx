import React from 'react';
import ChessBoard from './ChessBoard';
import GameInfo from './GameInfo';
import GameControls from './GameControls';
import { useAuth } from '../../contexts/AuthContext';

const GamePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="game-page">
      <header className="game-header">
        <div className="header-content">
          <h1>SuperChess</h1>
          <div className="user-info">
            <span>Welcome, {user?.email}</span>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="game-main">
        <div className="game-layout">
          <div className="game-board-section">
            <ChessBoard />
          </div>
          
          <div className="game-sidebar">
            <GameControls />
            <GameInfo />
          </div>
        </div>
      </main>
    </div>
  );
};

export default GamePage;
