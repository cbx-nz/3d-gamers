// Driving Game Module
class DrivingGame {
    constructor() {
        this.car = null;
        this.engine = null;
        this.speed = 0;
        this.maxSpeed = 25;
        this.acceleration = 20;
        this.brakeForce = 30;
        this.turnSpeed = 0.025;
        this.friction = 0.92;
        this.boundaries = [];
        this.wheels = [];
        this.otherPlayerCars = new Map();
    }

    async init(gameEngine) {
        this.engine = gameEngine;
        
        // Create ground (larger for the track)
        const ground = this.engine.createGround(400, 0x2F4F2F);
        this.engine.scene.add(ground);
        
        // Create track boundaries and surface
        this.createTrackBoundaries();
        
        // Create skybox
        const skybox = this.engine.createSkybox();
        this.engine.scene.add(skybox);
        
        // Create car at starting position
        this.createCar();
        
        // Position car at start line
        this.car.position.set(80, 0.8, 0);
        this.car.rotation.y = Math.PI / 2; // Face tangent to the track (proper forward direction)
        
        // Setup camera to follow car
        this.setupCamera();
        
        // Initialize multiplayer car tracking
        this.otherPlayerCars = new Map();
        
        console.log('Driving game initialized');
        console.log('Race around the oval track with other players!');
    }

    createCar() {
        // Create car group for better organization
        this.car = new THREE.Group();
        this.car.position.set(0, 0.8, 0);
        
        // Car body (lower and wider for racing look)
        const bodyGeometry = new THREE.BoxGeometry(4, 0.8, 2);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.position.y = 0.4;
        carBody.castShadow = true;
        this.car.add(carBody);
        
        // Car roof/cockpit
        const roofGeometry = new THREE.BoxGeometry(2.5, 0.6, 1.8);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x990000 });
        const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
        carRoof.position.set(0, 1, 0);
        carRoof.castShadow = true;
        this.car.add(carRoof);
        
        // Front bumper
        const bumperGeometry = new THREE.BoxGeometry(3.8, 0.3, 0.3);
        const bumperMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const frontBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        frontBumper.position.set(0, 0.15, 1.15);
        frontBumper.castShadow = true;
        this.car.add(frontBumper);
        
        // Headlights
        const lightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const lightMaterial = new THREE.MeshLambertMaterial({ color: 0xffffaa });
        const leftLight = new THREE.Mesh(lightGeometry, lightMaterial);
        leftLight.position.set(-1.2, 0.6, 1.2);
        this.car.add(leftLight);
        const rightLight = new THREE.Mesh(lightGeometry, lightMaterial);
        rightLight.position.set(1.2, 0.6, 1.2);
        this.car.add(rightLight);
        
        // Car wheels (bigger for racing look)
        const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 12);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const rimMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        
        const wheelPositions = [
            { x: -1.6, y: 0, z: 1.1 },  // Front left
            { x: 1.6, y: 0, z: 1.1 },   // Front right
            { x: -1.6, y: 0, z: -1.1 }, // Rear left
            { x: 1.6, y: 0, z: -1.1 }   // Rear right
        ];
        
        this.wheels = [];
        wheelPositions.forEach((pos, index) => {
            const wheelGroup = new THREE.Group();
            
            // Tire
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            wheelGroup.add(wheel);
            
            // Rim
            const rimGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.45, 8);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);
            
            wheelGroup.position.set(pos.x, pos.y, pos.z);
            this.car.add(wheelGroup);
            this.wheels.push(wheelGroup);
        });
        
        this.engine.scene.add(this.car);
    }

    createTrackBoundaries() {
        // Create a proper racing track with curves
        const trackWidth = 15;
        const trackRadius = 80;
        
        // Inner and outer track boundaries (oval track)
        this.createOvalTrack(trackRadius - trackWidth/2, 0xff4444); // Inner boundary
        this.createOvalTrack(trackRadius + trackWidth/2, 0xff4444); // Outer boundary
        
        // Track surface
        this.createTrackSurface(trackRadius, trackWidth);
        
        // Starting line
        this.createStartingLine();
        
        // Checkpoints around the track
        this.createCheckpoints(trackRadius);
        
        // Some decorative elements
        this.createTrackDecorations();
    }
    
    createOvalTrack(radius, color) {
        const boundaryMaterial = new THREE.MeshLambertMaterial({ color: color });
        const segments = 64;
        
        for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2;
            
            const x1 = Math.cos(angle1) * radius;
            const z1 = Math.sin(angle1) * radius;
            const x2 = Math.cos(angle2) * radius;
            const z2 = Math.sin(angle2) * radius;
            
            // Create barrier segment
            const barrierGeometry = new THREE.BoxGeometry(2, 4, 2);
            const barrier = new THREE.Mesh(barrierGeometry, boundaryMaterial);
            barrier.position.set(x1, 2, z1);
            barrier.lookAt(x2, 2, z2);
            barrier.castShadow = true;
            barrier.receiveShadow = true;
            this.engine.scene.add(barrier);
            this.boundaries.push(barrier);
        }
    }
    
    createTrackSurface(radius, width) {
        // Create track surface using multiple segments for smooth curves
        const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const segments = 32;
        
        for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2;
            
            const x1 = Math.cos(angle1) * radius;
            const z1 = Math.sin(angle1) * radius;
            const x2 = Math.cos(angle2) * radius;
            const z2 = Math.sin(angle2) * radius;
            
            // Track segment
            const segmentGeometry = new THREE.PlaneGeometry(width, 20);
            const segment = new THREE.Mesh(segmentGeometry, trackMaterial);
            segment.rotation.x = -Math.PI / 2;
            segment.position.set((x1 + x2) / 2, 0.01, (z1 + z2) / 2);
            segment.lookAt((x1 + x2) / 2, 0.01, (z1 + z2) / 2 + 1);
            segment.receiveShadow = true;
            this.engine.scene.add(segment);
        }
        
        // Add racing stripes
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            if (i % 4 === 0) { // Every 4th segment
                const stripeGeometry = new THREE.PlaneGeometry(1, 8);
                const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
                const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
                stripe.rotation.x = -Math.PI / 2;
                stripe.position.set(x, 0.02, z);
                stripe.lookAt(x, 0.02, z + 1);
                this.engine.scene.add(stripe);
            }
        }
    }
    
    createStartingLine() {
        const startMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const startGeometry = new THREE.PlaneGeometry(15, 2);
        const startLine = new THREE.Mesh(startGeometry, startMaterial);
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.set(80, 0.02, 0);
        this.engine.scene.add(startLine);
        
        // Checkered pattern
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 2; j++) {
                if ((i + j) % 2 === 0) {
                    const checkGeometry = new THREE.PlaneGeometry(1, 1);
                    const checkMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
                    const check = new THREE.Mesh(checkGeometry, checkMaterial);
                    check.rotation.x = -Math.PI / 2;
                    check.position.set(80, 0.03, -7.5 + i - 1 + j);
                    this.engine.scene.add(check);
                }
            }
        }
    }
    
    createCheckpoints(radius) {
        const checkpointPositions = [
            { angle: Math.PI / 2, name: "Checkpoint 1" },
            { angle: Math.PI, name: "Checkpoint 2" },
            { angle: 3 * Math.PI / 2, name: "Checkpoint 3" }
        ];
        
        checkpointPositions.forEach(cp => {
            const x = Math.cos(cp.angle) * radius;
            const z = Math.sin(cp.angle) * radius;
            
            const flagGeometry = new THREE.BoxGeometry(0.5, 8, 0.1);
            const flagMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
            const flag = new THREE.Mesh(flagGeometry, flagMaterial);
            flag.position.set(x, 4, z);
            flag.castShadow = true;
            this.engine.scene.add(flag);
        });
    }
    
    createTrackDecorations() {
        // Add some trees and buildings around the track
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = 120 + Math.random() * 50;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            if (Math.random() > 0.5) {
                // Tree
                const treeGeometry = new THREE.ConeGeometry(3, 12, 6);
                const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                const tree = new THREE.Mesh(treeGeometry, treeMaterial);
                tree.position.set(x, 6, z);
                tree.castShadow = true;
                this.engine.scene.add(tree);
                
                // Tree trunk
                const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4);
                const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.set(x, 2, z);
                trunk.castShadow = true;
                this.engine.scene.add(trunk);
            } else {
                // Building
                const buildingGeometry = new THREE.BoxGeometry(8, 15 + Math.random() * 10, 8);
                const buildingMaterial = new THREE.MeshLambertMaterial({ 
                    color: new THREE.Color().setHSL(Math.random(), 0.5, 0.6) 
                });
                const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                building.position.set(x, building.geometry.parameters.height / 2, z);
                building.castShadow = true;
                building.receiveShadow = true;
                this.engine.scene.add(building);
            }
        }
    }

    setupCamera() {
        // Third-person camera behind car
        this.engine.camera.position.set(0, 8, 15);
        this.engine.camera.lookAt(this.car.position);
    }

    update(deltaTime, keys) {
        if (!this.car) return;
        
        // Handle car controls
        let targetSpeed = 0;
        let turning = 0;
        
        // Acceleration and braking
        if (keys['KeyW'] || keys['ArrowUp']) {
            targetSpeed = this.maxSpeed;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            targetSpeed = -this.maxSpeed * 0.5; // Reverse slower
        }
        if (keys['Space']) {
            // Brake
            this.speed *= 0.85;
        }
        
        // Steering (only when moving)
        if (Math.abs(this.speed) > 0.1) {
            if (keys['KeyA'] || keys['ArrowLeft']) {
                turning = this.turnSpeed * (this.speed / this.maxSpeed);
            }
            if (keys['KeyD'] || keys['ArrowRight']) {
                turning = -this.turnSpeed * (this.speed / this.maxSpeed);
            }
        }
        
        // Update speed with acceleration/deceleration
        if (targetSpeed !== 0) {
            const acceleration = targetSpeed > this.speed ? this.acceleration : this.brakeForce;
            this.speed += (targetSpeed - this.speed) * acceleration * deltaTime;
        } else {
            this.speed *= this.friction;
        }
        
        // Apply turning
        if (turning !== 0) {
            this.car.rotation.y += turning;
            
            // Animate wheel turning for front wheels
            if (this.wheels) {
                this.wheels[0].rotation.y = turning * 5; // Front left
                this.wheels[1].rotation.y = turning * 5; // Front right
            }
        } else if (this.wheels) {
            // Return wheels to center
            this.wheels[0].rotation.y *= 0.9;
            this.wheels[1].rotation.y *= 0.9;
        }
        
        // Animate wheel rotation based on speed
        if (this.wheels) {
            const wheelRotation = this.speed * deltaTime * 2;
            this.wheels.forEach(wheel => {
                wheel.children[0].rotation.y += wheelRotation; // Tire rotation
                wheel.children[1].rotation.y += wheelRotation; // Rim rotation
            });
        }
        
        // Move car forward/backward based on its rotation
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.car.quaternion);
        direction.multiplyScalar(this.speed * deltaTime);
        
        // Store old position for collision detection
        const oldPosition = this.car.position.clone();
        this.car.position.add(direction);
        
        // Simple collision detection with boundaries
        if (this.checkCollisions()) {
            // Restore old position and stop
            this.car.position.copy(oldPosition);
            this.speed *= -0.3; // Bounce back slightly
        }
        
        // Update camera to follow car
        const carPosition = this.car.position.clone();
        const carDirection = new THREE.Vector3(0, 0, 1);
        carDirection.applyQuaternion(this.car.quaternion);
        
        const cameraPosition = carPosition.clone();
        cameraPosition.add(carDirection.multiplyScalar(15));
        cameraPosition.y += 8;
        
        this.engine.camera.position.lerp(cameraPosition, 3 * deltaTime);
        this.engine.camera.lookAt(carPosition);
        
        // Send multiplayer update with car data
        this.engine.sendPlayerUpdate(this.car.position, this.car.rotation, {
            type: 'driving',
            speed: this.speed
        });
        
        // Update other players' cars
        this.updateOtherPlayerCars();
    }
    
    updateOtherPlayerCars() {
        // Update visual representation of other players
        this.engine.players.forEach((player, playerId) => {
            if (playerId !== this.engine.playerId && player.userData && player.userData.type === 'driving') {
                // Create car for other player if it doesn't exist
                if (!this.otherPlayerCars.has(playerId)) {
                    this.createOtherPlayerCar(playerId);
                }
                
                const otherCar = this.otherPlayerCars.get(playerId);
                if (otherCar) {
                    // Smoothly interpolate position and rotation
                    otherCar.position.lerp(player.position, 0.1);
                    otherCar.rotation.y += (player.rotation.y - otherCar.rotation.y) * 0.1;
                }
            }
        });
    }
    
    createOtherPlayerCar(playerId) {
        // Create a simplified car for other players
        const otherCar = new THREE.Group();
        
        // Different color for other players
        const colors = [0x0066ff, 0x00ff66, 0xff6600, 0xff0066, 0x6600ff, 0xffff00];
        const carColor = colors[parseInt(playerId.slice(-1), 16) % colors.length];
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(4, 0.8, 2);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: carColor });
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.position.y = 0.4;
        carBody.castShadow = true;
        otherCar.add(carBody);
        
        // Car roof
        const roofGeometry = new THREE.BoxGeometry(2.5, 0.6, 1.8);
        const roofMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color(carColor).multiplyScalar(0.7) 
        });
        const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
        carRoof.position.set(0, 1, 0);
        carRoof.castShadow = true;
        otherCar.add(carRoof);
        
        // Simple wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        
        const wheelPositions = [
            { x: -1.6, y: 0, z: 1.1 },
            { x: 1.6, y: 0, z: 1.1 },
            { x: -1.6, y: 0, z: -1.1 },
            { x: 1.6, y: 0, z: -1.1 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.castShadow = true;
            otherCar.add(wheel);
        });
        
        this.engine.scene.add(otherCar);
        this.otherPlayerCars.set(playerId, otherCar);
        
        // Add player name above car
        this.addPlayerNameTag(otherCar, playerId);
    }
    
    addPlayerNameTag(car, playerId) {
        // Create a simple text sprite for player name
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(playerId.substring(0, 10), canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(0, 3, 0);
        sprite.scale.set(4, 1, 1);
        
        car.add(sprite);
    }

    checkCollisions() {
        const carBox = new THREE.Box3().setFromObject(this.car);
        
        for (let boundary of this.boundaries) {
            const boundaryBox = new THREE.Box3().setFromObject(boundary);
            if (carBox.intersectsBox(boundaryBox)) {
                return true;
            }
        }
        return false;
    }

    cleanup() {
        // Clean up game objects
        if (this.car) {
            this.engine.scene.remove(this.car);
        }
        
        // Clean up other player cars
        this.otherPlayerCars.forEach(car => {
            this.engine.scene.remove(car);
        });
        this.otherPlayerCars.clear();
        
        // Clean up boundaries and track elements
        this.boundaries.forEach(boundary => {
            this.engine.scene.remove(boundary);
        });
        this.boundaries = [];
        
        console.log('Driving game cleaned up');
    }
}

export default new DrivingGame();
