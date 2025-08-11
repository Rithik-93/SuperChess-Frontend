# SuperChess Frontend

A modern React-based chess application that integrates with the SuperChess backend services.

## Features

- **User Authentication**: Sign up and login functionality
- **Real-time Chess Games**: Play chess against other players via WebSocket
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Game Management**: Automatic matchmaking and game state synchronization
- **Move Validation**: Server-side move validation and game rule enforcement

## Architecture

The frontend integrates with two backend services:

1. **API Gateway** (port 3000): Handles user authentication and management
2. **Game Arena** (port 8080/ws): WebSocket server for real-time chess gameplay

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Running SuperChess backend services

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Backend Integration

Make sure your backend services are running:

1. **API Gateway**: Should be running on `http://localhost:3000`
2. **WebSocket Server**: Should be available at `ws://localhost:8080/ws`

The frontend is configured to connect to these endpoints by default.

## Project Structure

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   ├── Game/           # Chess game components
│   └── Layout/         # Layout components
├── contexts/
│   ├── AuthContext.tsx # Authentication state management
│   └── GameContext.tsx # Game state and WebSocket management
├── types/
│   └── index.ts        # TypeScript type definitions
├── App.tsx             # Main application component
├── App.css             # Global styles
└── main.tsx            # Application entry point
```

## Key Components

### AuthContext
Manages user authentication state and provides functions for login, signup, and logout.

### GameContext
Handles WebSocket connections, game state management, and real-time communication with the game server.

### ChessBoard
Interactive chess board component using `react-chessboard` library.

### GameControls
Connection management and game control interface.

### GameInfo
Displays current game status, player information, and move history.

## WebSocket Message Protocol

The frontend communicates with the game server using these message types:

- `join`: Request to join a game
- `move`: Send a chess move
- `state`: Receive game state updates
- `playerInfo`: Receive player assignment information
- `error`: Receive error messages

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build

## Dependencies

### Core Libraries
- React 19.1.0
- TypeScript
- Vite (build tool)

### Chess-specific Libraries
- `react-chessboard`: Interactive chess board component
- `chess.js`: Chess game logic (for client-side validation if needed)

### HTTP & WebSocket
- `axios`: HTTP client for API calls
- Native WebSocket API for real-time communication

### Routing & State
- `react-router-dom`: Client-side routing (if needed for future features)

## Configuration

The application uses these default endpoints:
- API Gateway: `http://localhost:3000`
- WebSocket Server: `ws://localhost:8080/ws`

These can be modified in the respective context files if your backend runs on different ports.

## Features in Detail

### Authentication Flow
1. User visits the application
2. If not authenticated, shows login/signup form
3. Credentials are validated against the API Gateway
4. JWT tokens are stored in HTTP-only cookies
5. Authenticated users can access the chess game

### Game Flow
1. User connects to WebSocket server
2. Clicks "Join Game" to enter matchmaking queue
3. When matched with opponent, receives game assignment
4. Players take turns making moves
5. Game state is synchronized in real-time
6. Game ends when checkmate, stalemate, or resignation occurs

### Move Handling
1. Player drags piece on the board
2. Move is validated client-side for basic rules
3. Move is sent to server in algebraic notation (e.g., "e2e4")
4. Server validates move and updates game state
5. Updated state is broadcast to both players

## Troubleshooting

### Connection Issues
- Ensure backend services are running on the correct ports
- Check browser console for WebSocket connection errors
- Verify CORS settings in the API Gateway

### Authentication Issues
- Clear browser cookies and try again
- Check that the API Gateway is accessible
- Verify JWT secret configuration in backend

### Game Issues
- Refresh the page to reset game state
- Check WebSocket connection status in the game controls
- Ensure both players are connected before making moves

## Contributing

1. Follow the existing code structure and naming conventions
2. Add TypeScript types for new features
3. Update this README for any architectural changes
4. Test authentication and game flows thoroughly

## License

This project is part of the SuperChess application suite.
