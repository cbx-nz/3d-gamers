# 3D Gamers - Browser-Based Game Framework

A simplified Roblox-like game framework that runs entirely in the browser with multiplayer support via WebSockets.

## Features

### Core Engine
- **3D Graphics**: Built with Three.js for hardware-accelerated 3D rendering
- **Physics System**: Basic gravity, collisions, and object interactions
- **Character Controller**: WASD movement with jumping and camera controls
- **Multiplayer**: Real-time WebSocket-based multiplayer with Node.js server
- **World System**: Create and manage 3D game scenes dynamically

### Game Library System
- **Dynamic Loading**: Games load without page refresh
- **Modular Design**: Each game is a separate module in `/games/` folder
- **Easy Development**: Simple `init()` and `update()` pattern for new games

### Included Games
1. **Driving Game** - 3D car driving with physics and track boundaries
2. **Sandbox World** - Build and explore with character controller

### User Interface
- **Main Menu**: Clean game selection interface
- **HUD Elements**: FPS counter and navigation controls
- **Responsive Design**: Works on desktop and mobile browsers

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open Your Browser
Navigate to `http://localhost:8080`

## Game Controls

### Driving Game
- **W/S**: Accelerate/Reverse
- **A/D**: Steering
- **Space**: Brake
- **Esc**: Return to main menu

### Sandbox World
- **WASD**: Move character
- **Space**: Jump
- **Mouse Click**: Add objects
- **Right Click**: Remove objects
- **1/2**: Switch between box/sphere objects
- **Esc**: Return to main menu

## File Structure

```
3d-gamers/
├── public/
│   ├── index.html      # Main HTML page
│   ├── style.css       # Styling for UI/HUD
│   └── main.js         # Core game engine
├── games/
│   ├── driving.js      # Driving game module
│   └── sandbox.js      # Sandbox world module
├── server.js           # Node.js WebSocket server
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Creating New Games

To add a new game, create a file in the `/games/` folder:

```javascript
// games/mygame.js
class MyGame {
    async init(gameEngine) {
        // Initialize your game
        this.engine = gameEngine;
        
        // Add objects to scene
        const ground = this.engine.createGround(50);
        this.engine.scene.add(ground);
    }

    update(deltaTime, keys) {
        // Update game logic each frame
        // deltaTime = time since last frame
        // keys = current pressed keys object
    }

    cleanup() {
        // Clean up when returning to menu
    }
}

export default new MyGame();
```

Then add it to the games list in `main.js`:

```javascript
const games = [
    { name: 'My Game', file: 'mygame.js' },
    // ... other games
];
```

## Multiplayer Features

- **Real-time Sync**: Player positions and actions sync across clients
- **Object Sharing**: Created objects appear for all players
- **Automatic Reconnection**: Handles connection drops gracefully
- **Scalable**: Server supports multiple concurrent players

## Technical Details

### Client-Side (Browser)
- **Three.js**: 3D rendering and scene management
- **WebSocket Client**: Real-time communication
- **ES6 Modules**: Modern JavaScript with dynamic imports
- **Responsive Canvas**: Automatic resize handling

### Server-Side (Node.js)
- **Express**: Static file serving
- **WebSocket Server**: Real-time multiplayer communication
- **Player Management**: Track player states and positions
- **Object Synchronization**: Shared world state

## Performance Optimizations

- **Efficient Rendering**: 60 FPS target with optimized draw calls
- **Lightweight Assets**: Minimal textures and simple geometries
- **Smart Updates**: Only sync changed data over network
- **Garbage Collection**: Proper cleanup of unused objects

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **WebGL Support**: Required for 3D graphics
- **WebSocket Support**: Required for multiplayer
- **ES6 Modules**: Required for dynamic game loading

## Development Tips

1. **Testing**: Use browser dev tools for debugging
2. **Performance**: Monitor FPS counter for optimization
3. **Multiplayer**: Test with multiple browser tabs
4. **Physics**: Keep physics simple for better performance
5. **Assets**: Use lightweight models and textures

## Future Enhancements

- [ ] Advanced physics engine integration
- [ ] Texture and model loading system
- [ ] Audio system for sound effects and music
- [ ] In-game chat system
- [ ] User accounts and save system
- [ ] Advanced lighting and shadows
- [ ] Mobile touch controls
- [ ] Game creation tools in browser

## License

MIT License - Feel free to use and modify for your projects!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

Enjoy building awesome 3D games! 🎮
