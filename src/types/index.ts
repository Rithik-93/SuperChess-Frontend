// User types
export interface User {
  id: number;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  data: any;
}

export interface JoinData {
  gameId?: string;
  playerId: string;
}

export interface CreateGameData {
  playerId: string;
}

export interface JoinInviteData {
  gameId: string;
  playerId: string;
}

export interface GameCreatedData {
  gameId: string;
}

export interface MoveData {
  gameId: string;
  playerId: string;
  move: string;
}

export interface GameStateData {
  gameId: string;
  fen: string;
  board: string[][];
  turn: string;
  moves: string[];
  inCheck: boolean;
  gameOver: boolean;
  winner?: string;
  reason?: string;
  whiteTime?: number; // milliseconds
  blackTime?: number; // milliseconds
}

export interface TimerData {
  gameId: string;
  whiteTime: number; // milliseconds
  blackTime: number; // milliseconds
  currentTurn: string;
}

export interface TimeUpData {
  gameId: string;
  loser: string;
  winner: string;
  reason: string;
}

export interface ErrorData {
  message: string;
}

export interface PlayerInfoData {
  playerId: string;
  color: string;
  gameId: string;
}

// Chess game state
export interface GameState {
  gameId: string | null;
  playerId: string | null;
  playerColor: string | null;
  board: string[][];
  fen: string;
  turn: string;
  moves: string[];
  inCheck: boolean;
  gameOver: boolean;
  winner?: string;
  reason?: string;
  whiteTime?: number; // milliseconds
  blackTime?: number; // milliseconds
  isConnected: boolean;
  isWaitingForMatch: boolean;
  createdGameId: string | null;
  isWaitingForPlayer: boolean;
  error?: string;
}
