// import React, { useState } from 'react';
// import { useGame } from '../../contexts/GameContext';
// import JoinGameModal from './JoinGameModal';
// import { Button } from '../ui/button';
// import { Badge } from '../ui/badge';

// const GameControls: React.FC = () => {
//   const { gameState, connect, disconnect, joinGame, createGame, joinInvite, resetGame } = useGame();
//   const [showJoinModal, setShowJoinModal] = useState(false);

//   const handleConnect = () => {
//     if (gameState.isConnected) {
//       disconnect();
//     } else {
//       connect();
//     }
//   };

//   const handleJoinGame = () => {
//     if (!gameState.isConnected) {
//       connect();
//       // Wait a bit for connection then join
//       setTimeout(() => joinGame(), 500);
//     } else {
//       joinGame();
//     }
//   };

//   const handleCreateGame = () => {
//     if (!gameState.isConnected) {
//       connect();
//       setTimeout(() => createGame(), 500);
//     } else {
//       createGame();
//     }
//   };

//   const handleJoinByCode = () => {
//     setShowJoinModal(true);
//   };

//   const handleJoinWithGameId = (gameId: string) => {
//     setShowJoinModal(false);
//     if (!gameState.isConnected) {
//       connect();
//       setTimeout(() => joinInvite(gameId), 500);
//     } else {
//       joinInvite(gameId);
//     }
//   };

//   const getJoinButtonText = () => {
//     if (gameState.isWaitingForMatch) return 'Waiting for opponent...';
//     if (gameState.gameId) return 'Game in progress';
//     if (!gameState.isConnected) return 'Connect & Join Game';
//     return 'Join Random Game';
//   };

//   const getCreateButtonText = () => {
//     if (!gameState.isConnected) return 'Connect & Create Game';
//     return 'Create Private Game';
//   };

//   const isJoinDisabled = () => {
//     return gameState.isWaitingForMatch || gameState.isWaitingForPlayer || (gameState.gameId !== null);
//   };

//   const isCreateDisabled = () => {
//     return gameState.isWaitingForMatch || gameState.isWaitingForPlayer || (gameState.gameId !== null);
//   };

//   const isJoinByCodeDisabled = () => {
//     return gameState.isWaitingForMatch || gameState.isWaitingForPlayer || (gameState.gameId !== null);
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center gap-2">
//         <Badge variant={gameState.isConnected ? 'success' : 'destructive'}>
//           <span className="inline-flex items-center gap-2">
//             <span className={`w-2 h-2 rounded-full ${gameState.isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
//             {gameState.isConnected ? 'Connected' : 'Disconnected'}
//           </span>
//         </Badge>
//         {gameState.isWaitingForMatch && (
//           <Badge variant="warning">Matching...</Badge>
//         )}
//       </div>

//       <div className="grid grid-cols-1 gap-2">
//         <Button onClick={handleConnect} variant={gameState.isConnected ? 'destructive' : 'default'}>
//           {gameState.isConnected ? 'Disconnect' : 'Connect'}
//         </Button>

//         <Button onClick={handleJoinGame} disabled={isJoinDisabled()}>
//           {getJoinButtonText()}
//         </Button>

//         <Button onClick={handleCreateGame} disabled={isCreateDisabled()} variant="secondary">
//           {getCreateButtonText()}
//         </Button>

//         <Button onClick={handleJoinByCode} disabled={isJoinByCodeDisabled()} variant="outline">
//           Join Specific Game
//         </Button>
//       </div>

//       {(gameState.gameOver || gameState.gameId) && (
//         <Button onClick={resetGame} variant="secondary">
//           New Game
//         </Button>
//       )}

//       {gameState.error && (
//         <div className="rounded-xl border border-red-400/30 bg-red-400/15 text-red-200 p-3 text-sm">
//           <strong className="mr-1">Error:</strong> {gameState.error}
//         </div>
//       )}

//       {gameState.isWaitingForMatch && (
//         <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-white/80 text-sm text-center">
//           <div className="mx-auto mb-2 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//           Looking for an opponent...
//         </div>
//       )}

//       {gameState.isWaitingForPlayer && (
//         <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-white/80 text-sm text-center">
//           <div className="mx-auto mb-2 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//           Waiting for your friend to join...
//         </div>
//       )}

//       <JoinGameModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} onJoin={handleJoinWithGameId} />
//     </div>
//   );
// };

// export default GameControls;