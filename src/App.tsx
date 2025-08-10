import { useState, useEffect, useRef, useMemo } from 'react'
import { Chessboard as ChessboardBase } from 'react-chessboard'
import { Chess } from 'chess.js'
import './App.css'
import Auth from './components/Auth'

// Types based on the WebSocket schema
interface GameState {
  gameId: string;
  fen: string;
  board: string[][];
  turn: string;
  moves: string[];
  inCheck: boolean;
  gameOver: boolean;
  winner?: string;
  reason?: string;
}

interface WSMessage {
  type: string;
  data: any;
}

interface PlayerInfo {
  playerId: string;
  color: string;
  gameId: string;
}

function App() {
  const Chessboard: any = ChessboardBase as unknown as any;
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [status, setStatus] = useState('Connecting...');
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  // Locally displayed FEN (allows optimistic updates on drag-drop before server echoes state)
  const [displayFen, setDisplayFen] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8080/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setStatus('Connected. Looking for opponent...');
      setError('');
      // Send join message
      ws.send(JSON.stringify({
        type: 'join',
        data: {
          gameId: '',
          playerId: ''
        }
      }));
    };

    ws.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);
      handleMessage(message);
    };

    ws.onclose = () => {
      setConnected(false);
      setStatus('Disconnected');
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      setError('WebSocket error occurred');
      console.error('WebSocket error:', error);
    };
  };

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'state':
        const newGameState = message.data as GameState;
        setGameState(newGameState);
        setGameHistory(newGameState.moves || []);
        setDisplayFen(newGameState.fen);
        
        if (newGameState.gameOver) {
          if (newGameState.winner) {
            setStatus(`Game Over - ${newGameState.winner} wins! (${newGameState.reason})`);
          } else {
            setStatus(`Game Over - Draw! (${newGameState.reason})`);
          }
        } else {
          const turnText = newGameState.turn === 'white' ? 'White' : 'Black';
          const checkText = newGameState.inCheck ? ' (In Check!)' : '';
          setStatus(`${turnText} to move${checkText}`);
        }
        setError('');
        break;
      
      case 'error':
        setError(message.data.message);
        break;
      
      case 'playerInfo':
        const newPlayerInfo = message.data as PlayerInfo;
        setPlayerInfo(newPlayerInfo);
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Derived helpers
  const isMyTurn = useMemo(() => {
    if (!gameState || !playerInfo) return false;
    return gameState.turn === playerInfo.color && !gameState.gameOver;
  }, [gameState, playerInfo]);

  const boardOrientation = useMemo<'white' | 'black'>(() => {
    return playerInfo?.color === 'black' ? 'black' : 'white';
  }, [playerInfo]);

  const currentFen = useMemo<string>(() => {
    return displayFen ?? gameState?.fen ?? 'start';
  }, [displayFen, gameState]);

  // Drag-drop handler: validate locally using chess.js, send SAN to server, optimistic FEN update
  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    if (!gameState || !playerInfo || !wsRef.current) return false;
    if (!isMyTurn) return false;

    const chess = new Chess(currentFen);
    const sourcePiece = chess.get(sourceSquare as any);
    if (!sourcePiece) return false;
    const pieceColor = sourcePiece.color === 'w' ? 'white' : 'black';
    if (pieceColor !== playerInfo.color) return false;

    const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (!move) {
      return false; // illegal
    }

    // Send SAN to server
    wsRef.current.send(JSON.stringify({
      type: 'move',
      data: {
        gameId: gameState.gameId,
        playerId: playerInfo.playerId,
        move: move.san,
      },
    }));

    // Optimistic update until server state arrives
    setDisplayFen(chess.fen());
    return true;
  };

  const renderMoveHistory = () => {
    if (!gameHistory.length) return null;

    return (
      <div className="move-history">
        <h3>Move History</h3>
        <div className="moves-container">
          {gameHistory.map((move, index) => (
            <span key={index} className="move-item">
              {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'} {move}
            </span>
          ))}
        </div>
      </div>
    );
  };

    return (
      <div className="app">
      <header className="app-header">
        <h1>SuperChess</h1>
        <div className="connection-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          {status}
        </div>
      </header>

      <main className="game-container">
        <Auth />
        <div className="game-board">
          <Chessboard
            position={currentFen}
            boardOrientation={boardOrientation}
            arePiecesDraggable={isMyTurn}
            onPieceDrop={(sourceSquare: string, targetSquare: string) => onPieceDrop(sourceSquare, targetSquare)}
          />
        </div>
        
        <div className="game-info">
          <div className="game-status">
            <h2>Game Status</h2>
            {playerInfo && (
              <p className="player-color">
                You are playing as: <strong>{playerInfo.color}</strong>
              </p>
            )}
            <p>{status}</p>
            {error && <p className="error">{error}</p>}
            {gameState && playerInfo && (
              <p className={`turn-indicator ${gameState.turn === playerInfo.color ? 'your-turn' : 'opponent-turn'}`}>
                {gameState.turn === playerInfo.color ? "Your turn!" : "Opponent's turn"}
              </p>
            )}
          </div>

          {renderMoveHistory()}
        </div>
      </main>
    </div>
  );
}

export default App;
