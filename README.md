# Skribbl Clone

A real-time multiplayer drawing and guessing game inspired by Skribbl.io.

## Features

- Real-time multiplayer gameplay
- Create and join private rooms
- Invite room links
- Real-time drawing synchronization
- Word selection system
- Chat and guessing system
- Scoreboard and winner tracking
- Configurable rounds and draw timer
- Undo, eraser, and clear canvas
- Responsive modern UI
- Socket.IO powered communication

## Tech Stack

### Frontend
- React
- Vite
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO

## Live Demo

Frontend:
PASTE_YOUR_VERCEL_URL

Backend:
PASTE_YOUR_RENDER_URL

## Installation

### Clone repository

```bash
git clone YOUR_GITHUB_REPO_LINK
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Backend Setup

```bash
cd server
npm install
node server.js
```

## Architecture

- Frontend handles UI, drawing canvas, and game state rendering.
- Backend manages rooms, timers, players, word logic, and Socket.IO events.
- Real-time communication occurs through WebSockets using Socket.IO.

## Author

Shriyansh Srivastava
