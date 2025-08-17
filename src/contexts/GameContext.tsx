import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { GameState, WSMessage, JoinData, MoveData, GameStateData, PlayerInfoData, ErrorData, CreateGameData, JoinInviteData, GameCreatedData } from '../types';

interface GameContextType {
  gameState: GameState;
  connect: (gameId?: string) => void;
  disconnect: () => void;
  joinGame: () => void;
  createGame: () => void;
  joinInvite: (gameId: string) => void;
  makeMove: (move: string) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const WS_URL = 'ws://localhost:8080/ws';

const initialGameState: GameState = {
  gameId: null,
  playerId: null,
  playerColor: null,
  board: Array(8).fill(null).map(() => Array(8).fill('')),
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'white',
  moves: [],
  inCheck: false,
  gameOver: false,
  isConnected: false,
  isWaitingForMatch: false,
  createdGameId: null,
  isWaitingForPlayer: false,
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  const { refreshToken } = useAuth();

  const connect = (gameId?: string) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const wsUrl = gameId ? `${WS_URL}?gameId=${gameId}` : WS_URL;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected' + (gameId ? ` to game: ${gameId}` : ''));
        setGameState(prev => ({
          ...prev,
          isConnected: true,
          error: undefined,
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        if (event.code === 1008 || event.code === 1011) {
          reconnectWithTokenRefresh(gameId);
        } else {
          setGameState(prev => ({
            ...prev,
            isConnected: false,
          }));
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setGameState(prev => ({
          ...prev,
          error: 'Connection error',
          isConnected: false,
        }));
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setGameState(prev => ({
        ...prev,
        error: 'Failed to connect',
        isConnected: false,
      }));
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setGameState(initialGameState);
  };

  const reconnectWithTokenRefresh = async (gameId?: string) => {
    try {
      console.log('Attempting to refresh token and reconnect...');
      const success = await refreshToken();
      if (success) {
        console.log('Token refreshed, reconnecting...');
        setTimeout(() => connect(gameId), 500);
      } else {
        console.log('Token refresh failed, redirecting to login');
        navigate('/login');
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      navigate('/login');
    }
  };

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'playerInfo':
        const playerInfo: PlayerInfoData = message.data;
        console.log('Received playerInfo:', playerInfo);
        
        const currentPath = window.location.pathname;
        if (!currentPath.includes(`/game/${playerInfo.gameId}`)) {
          navigate(`/game/${playerInfo.gameId}`);
        }
        
        setGameState(prev => ({
          ...prev,
          gameId: playerInfo.gameId,
          playerId: playerInfo.playerId.toString(),
          playerColor: playerInfo.color,
          isWaitingForMatch: false,
          isWaitingForPlayer: false,
        }));
        break;

      case 'gameCreated':
        const gameCreatedData: GameCreatedData = message.data;
        setGameState(prev => ({
          ...prev,
          createdGameId: gameCreatedData.gameId,
          isWaitingForPlayer: true,
        }));
        break;

      case 'state':
        const gameStateData: GameStateData = message.data;
        setGameState(prev => ({
          ...prev,
          gameId: gameStateData.gameId,
          board: gameStateData.board,
          fen: gameStateData.fen,
          turn: gameStateData.turn,
          moves: gameStateData.moves,
          inCheck: gameStateData.inCheck,
          gameOver: gameStateData.gameOver,
          winner: gameStateData.winner,
          reason: gameStateData.reason,
          isWaitingForPlayer: false,
          createdGameId: null,
        }));
        break;

      case 'error':
        const errorData: ErrorData = message.data;
        setGameState(prev => ({
          ...prev,
          error: errorData.message,
          isWaitingForMatch: false,
          isWaitingForPlayer: false,
        }));
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const sendMessage = (message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      setGameState(prev => ({
        ...prev,
        error: 'Not connected to server',
      }));
    }
  };

  const joinGame = () => {
    if (!gameState.isConnected) {
      setGameState(prev => ({
        ...prev,
        error: 'Not connected to server',
      }));
      return;
    }

    const joinData: JoinData = {
      playerId: gameState.playerId || `player_${Date.now()}`,
    };

    sendMessage({
      type: 'join',
      data: joinData,
    });

    setGameState(prev => ({
      ...prev,
      isWaitingForMatch: true,
      error: undefined,
    }));
  };

  const createGame = () => {
    if (!gameState.isConnected) {
      setGameState(prev => ({
        ...prev,
        error: 'Not connected to server',
      }));
      return;
    }

    const createGameData: CreateGameData = {
      playerId: gameState.playerId || `player_${Date.now()}`,
    };

    sendMessage({
      type: 'createGame',
      data: createGameData,
    });

    setGameState(prev => ({
      ...prev,
      error: undefined,
    }));
  };

  const joinInvite = (gameId: string) => {
    if (!gameState.isConnected) {
      setGameState(prev => ({
        ...prev,
        error: 'Not connected to server',
      }));
      return;
    }

    const joinInviteData: JoinInviteData = {
      gameId,
      playerId: gameState.playerId || `player_${Date.now()}`,
    };

    sendMessage({
      type: 'joinInvite',
      data: joinInviteData,
    });

    setGameState(prev => ({
      ...prev,
      error: undefined,
    }));
  };

  const makeMove = (move: string) => {
    if (!gameState.gameId || !gameState.playerId) {
      setGameState(prev => ({
        ...prev,
        error: 'No active game',
      }));
      return;
    }

    const moveData: MoveData = {
      gameId: gameState.gameId,
      playerId: gameState.playerId,
      move,
    };

    sendMessage({
      type: 'move',
      data: moveData,
    });
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...initialGameState,
      isConnected: prev.isConnected,
    }));
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    const gameIdMatch = currentPath.match(/\/game\/(.+)/);
    
    if (gameIdMatch) {
      const gameId = gameIdMatch[1];
      if (!gameState.isConnected) {
        setTimeout(() => connect(gameId), 100);
      }
    }
    
    return () => {
      disconnect();
    };
  }, []);

  useEffect(() => {
    if (!gameState.isConnected) return;

    const refreshInterval = setInterval(async () => {
      try {
        console.log('Periodic token refresh for game connection...');
        await refreshToken();
      } catch (err) {
        console.error('Periodic token refresh failed:', err);
        if (gameState.gameId) {
          reconnectWithTokenRefresh(gameState.gameId);
        }
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [gameState.isConnected, gameState.gameId]);

  const value: GameContextType = {
    gameState,
    connect,
    disconnect,
    joinGame,
    createGame,
    joinInvite,
    makeMove,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
