const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const express = require('express');

// Create Express app for serving static files
const app = express();

// Set proper MIME types for JavaScript modules
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Serve games folder with proper MIME type
app.use('/games', express.static('games', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Game state
const players = new Map();
const gameObjects = new Map();

// Player class
class Player {
    constructor(id, ws) {
        this.id = id;
        this.ws = ws;
        this.position = { x: 0, y: 2, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.currentGame = null;
    }
}

// Generate unique player ID
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

// Broadcast message to all players except sender
function broadcast(senderWs, message) {
    wss.clients.forEach(client => {
        if (client !== senderWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Broadcast to all players
function broadcastToAll(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    const playerId = generatePlayerId();
    const player = new Player(playerId, ws);
    players.set(playerId, player);
    
    console.log(`Player ${playerId} connected. Total players: ${players.size}`);
    
    // Send player their ID
    ws.send(JSON.stringify({
        type: 'playerId',
        id: playerId
    }));
    
    // Notify other players about new player
    broadcast(ws, {
        type: 'playerJoined',
        player: {
            id: playerId,
            position: player.position,
            rotation: player.rotation
        }
    });
    
    // Send existing players to new player
    players.forEach((existingPlayer, existingPlayerId) => {
        if (existingPlayerId !== playerId) {
            ws.send(JSON.stringify({
                type: 'playerJoined',
                player: {
                    id: existingPlayerId,
                    position: existingPlayer.position,
                    rotation: existingPlayer.rotation
                }
            }));
        }
    });
    
    // Handle messages from client
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleClientMessage(playerId, message);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        players.delete(playerId);
        console.log(`Player ${playerId} disconnected. Total players: ${players.size}`);
        
        // Notify other players
        broadcast(ws, {
            type: 'playerLeft',
            playerId: playerId
        });
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);
    });
});

// Handle messages from clients
function handleClientMessage(playerId, message) {
    const player = players.get(playerId);
    if (!player) return;
    
    switch (message.type) {
        case 'playerUpdate':
            // Update player position and rotation
            player.position = message.position;
            player.rotation = message.rotation;
            player.userData = message.userData;
            player.currentGame = message.game;
            
            // Broadcast update to other players
            broadcast(player.ws, {
                type: 'playerUpdate',
                playerId: playerId,
                position: player.position,
                rotation: player.rotation,
                userData: player.userData
            });
            break;
            
        case 'gameChange':
            // Player changed games
            player.currentGame = message.game;
            broadcast(player.ws, {
                type: 'playerGameChange',
                playerId: playerId,
                game: message.game
            });
            break;
            
        case 'objectAdded':
            // Player added an object in sandbox mode
            const objectId = 'obj_' + Math.random().toString(36).substr(2, 9);
            gameObjects.set(objectId, {
                id: objectId,
                ...message.objectData,
                playerId: playerId
            });
            
            broadcast(player.ws, {
                type: 'objectAdded',
                objectId: objectId,
                objectData: message.objectData,
                playerId: playerId
            });
            break;
            
        case 'objectRemoved':
            // Player removed an object
            if (gameObjects.has(message.objectId)) {
                gameObjects.delete(message.objectId);
                broadcast(player.ws, {
                    type: 'objectRemoved',
                    objectId: message.objectId,
                    playerId: playerId
                });
            }
            break;
            
        case 'chatMessage':
            // Broadcast chat message
            broadcast(player.ws, {
                type: 'chatMessage',
                playerId: playerId,
                message: message.message,
                timestamp: Date.now()
            });
            break;
            
        default:
            console.log(`Unknown message type: ${message.type}`);
    }
}

// Game loop for server-side physics and updates
function gameLoop() {
    // Server-side game logic can go here
    // For now, we'll just keep the connection alive
    
    // Clean up disconnected players
    players.forEach((player, playerId) => {
        if (player.ws.readyState !== WebSocket.OPEN) {
            players.delete(playerId);
        }
    });
}

// Run game loop every 50ms (20 FPS server tick rate)
setInterval(gameLoop, 50);

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`3D Gamers multiplayer server running on port ${PORT}`);
    console.log(`HTTP server: http://localhost:${PORT}`);
    console.log(`WebSocket server: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    
    // Close all WebSocket connections
    wss.clients.forEach(client => {
        client.close();
    });
    
    // Close server
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = { server, wss };
