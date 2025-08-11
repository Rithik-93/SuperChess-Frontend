import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { GameState, WSMessage, JoinData, MoveData, GameStateData, PlayerInfoData, ErrorData } from '../types';

interface GameContextType {
  gameState: GameState;
  connect: () => void;
  disconnect: () => void;
  joinGame: () => void;
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
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
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

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setGameState(prev => ({
          ...prev,
          isConnected: false,
        }));
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

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'playerInfo':
        const playerInfo: PlayerInfoData = message.data;
        setGameState(prev => ({
          ...prev,
          gameId: playerInfo.gameId,
          playerId: playerInfo.playerId,
          playerColor: playerInfo.color,
          isWaitingForMatch: false,
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
        }));
        break;

      case 'error':
        const errorData: ErrorData = message.data;
        setGameState(prev => ({
          ...prev,
          error: errorData.message,
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: GameContextType = {
    gameState,
    connect,
    disconnect,
    joinGame,
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
