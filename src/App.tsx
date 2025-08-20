import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import GameArenaPage from './pages/GameArenaPage';
import CreateGamePage from './pages/CreateGamePage';
import RandomMatchPage from './pages/RandomMatchPage';
import LoadingSpinner from './components/Layout/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to home if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <GameProvider>
              <HomePage />
            </GameProvider>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/game/:gameId" 
        element={
          <ProtectedRoute>
            <GameProvider>
              <GameArenaPage />
            </GameProvider>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-game" 
        element={
          <ProtectedRoute>
            <GameProvider>
              <CreateGamePage />
            </GameProvider>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/random-match" 
        element={
          <ProtectedRoute>
            <GameProvider>
              <RandomMatchPage />
            </GameProvider>
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
