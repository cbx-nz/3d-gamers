// 3D Gamers - Main Game Engine
class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.players = new Map();
        this.currentGame = null;
        this.socket = null;
        this.playerId = null;
        this.keys = {};
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
        
        this.init();
        this.setupEventListeners();
        this.connectWebSocket();
        this.loadGames();
    }

    init() {
        // Setup Three.js renderer
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create scene and camera
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Setup default lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Start render loop
        this.animate();
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Key events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // ESC to return to menu
            if (event.code === 'Escape') {
                this.returnToMenu();
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // Back to menu button
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.returnToMenu();
        });
    }

    connectWebSocket() {
        try {
            this.socket = new WebSocket('ws://localhost:8080');
            
            this.socket.onopen = () => {
                console.log('Connected to multiplayer server');
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleServerMessage(data);
            };

            this.socket.onclose = () => {
                console.log('Disconnected from multiplayer server');
                // Try to reconnect after 3 seconds
                setTimeout(() => this.connectWebSocket(), 3000);
            };

            this.socket.onerror = (error) => {
                console.log('WebSocket error, running in single-player mode');
            };
        } catch (error) {
            console.log('Could not connect to multiplayer server, running in single-player mode');
        }
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'playerId':
                this.playerId = data.id;
                break;
            case 'playerJoined':
                this.addPlayer(data.player);
                break;
            case 'playerLeft':
                this.removePlayer(data.playerId);
                break;
            case 'playerUpdate':
                this.updatePlayer(data.playerId, data.position, data.rotation, data.userData);
                break;
        }
    }

    sendPlayerUpdate(position, rotation, userData = null) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'playerUpdate',
                position: position,
                rotation: rotation,
                userData: userData,
                game: this.currentGame ? this.currentGame.constructor.name : null
            }));
        }
    }

    addPlayer(playerData) {
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const player = new THREE.Mesh(geometry, material);
        player.position.copy(playerData.position);
        player.castShadow = true;
        this.scene.add(player);
        this.players.set(playerData.id, player);
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.scene.remove(player);
            this.players.delete(playerId);
        }
    }

    updatePlayer(playerId, position, rotation, userData = null) {
        const player = this.players.get(playerId);
        if (player) {
            player.position.copy(position);
            player.rotation.copy(rotation);
            if (userData) {
                player.userData = userData;
            }
        }
    }

    async loadGames() {
        const games = [
            { name: 'Driving Game', file: 'driving.js' },
            { name: 'Sandbox World', file: 'sandbox.js' }
        ];

        const gameList = document.getElementById('game-list');
        games.forEach(game => {
            const li = document.createElement('li');
            li.textContent = game.name;
            li.addEventListener('click', () => this.loadGame(game.file));
            gameList.appendChild(li);
        });
    }

    async loadGame(gameFile) {
        try {
            console.log(`Attempting to load game: ${gameFile}`);
            
            // Clear current scene
            this.clearScene();
            
            // Load game module - use absolute path from root
            const gameModule = await import(`/games/${gameFile}`);
            console.log(`Game module loaded:`, gameModule);
            
            this.currentGame = gameModule.default;
            console.log(`Current game set:`, this.currentGame);
            
            // Initialize game
            await this.currentGame.init(this);
            
            // Hide menu, show game
            document.getElementById('menu').classList.add('hidden');
            document.getElementById('back-to-menu').style.display = 'block';
            
            console.log(`Successfully loaded game: ${gameFile}`);
            
        } catch (error) {
            console.error('Failed to load game:', error);
            console.error('Error details:', error.message, error.stack);
            alert(`Failed to load game: ${gameFile}\nError: ${error.message}`);
            
            // Return to menu on error
            this.returnToMenu();
        }
    }

    returnToMenu() {
        // Stop current game
        if (this.currentGame && this.currentGame.cleanup) {
            this.currentGame.cleanup();
        }
        this.currentGame = null;
        
        // Clear scene
        this.clearScene();
        
        // Show menu, hide game UI
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('back-to-menu').style.display = 'none';
        
        // Reset camera
        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);
    }

    clearScene() {
        // Remove all objects except lights
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            if (child.isMesh) {
                objectsToRemove.push(child);
            }
        });
        objectsToRemove.forEach(obj => this.scene.remove(obj));
        
        // Clear players
        this.players.clear();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update FPS counter
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
            document.getElementById('fps').textContent = `FPS: ${this.fps}`;
        }
        
        // Update current game
        if (this.currentGame && this.currentGame.update) {
            this.currentGame.update(deltaTime, this.keys);
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    // Utility methods for games
    createBox(size = 1, color = 0x00ff00, position = { x: 0, y: 0, z: 0 }) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshLambertMaterial({ color: color });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(position.x, position.y, position.z);
        box.castShadow = true;
        box.receiveShadow = true;
        return box;
    }

    createGround(size = 100, color = 0x228B22) {
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshLambertMaterial({ color: color });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        return ground;
    }

    createSkybox() {
        const geometry = new THREE.SphereGeometry(500, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        return new THREE.Mesh(geometry, material);
    }
}

// Character Controller Class
class CharacterController {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.position = new THREE.Vector3(0, 2, 0);
        this.rotation = new THREE.Euler();
        this.grounded = false;
        this.speed = 5;
        this.jumpForce = 10;
        this.gravity = -25;
        
        // Create character mesh
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        scene.add(this.mesh);
        
        // Setup camera offset
        this.cameraOffset = new THREE.Vector3(0, 3, 5);
    }

    update(deltaTime, keys) {
        // Handle input
        const moveVector = new THREE.Vector3();
        
        if (keys['KeyW']) moveVector.z -= 1;
        if (keys['KeyS']) moveVector.z += 1;
        if (keys['KeyA']) moveVector.x -= 1;
        if (keys['KeyD']) moveVector.x += 1;
        
        // Normalize movement
        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(this.speed);
            this.velocity.x = moveVector.x;
            this.velocity.z = moveVector.z;
        } else {
            this.velocity.x *= 0.8; // Friction
            this.velocity.z *= 0.8;
        }
        
        // Jumping
        if (keys['Space'] && this.grounded) {
            this.velocity.y = this.jumpForce;
            this.grounded = false;
        }
        
        // Apply gravity
        this.velocity.y += this.gravity * deltaTime;
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground collision (simple)
        if (this.position.y <= 1) {
            this.position.y = 1;
            this.velocity.y = 0;
            this.grounded = true;
        }
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // Update camera
        const cameraPosition = this.position.clone().add(this.cameraOffset);
        this.camera.position.copy(cameraPosition);
        this.camera.lookAt(this.position);
    }
}

// Initialize game engine when page loads
let gameEngine;
window.addEventListener('DOMContentLoaded', () => {
    gameEngine = new GameEngine();
    window.gameEngine = gameEngine; // Make globally accessible
});
