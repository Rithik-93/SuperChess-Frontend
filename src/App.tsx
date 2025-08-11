import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import AuthPage from './components/Auth/AuthPage';
import GamePage from './components/Game/GamePage';
import LoadingSpinner from './components/Layout/LoadingSpinner';
import './App.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <GameProvider>
      <GamePage />
    </GameProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="app">
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default App;
