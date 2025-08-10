// Sandbox World Game Module
class SandboxGame {
    constructor() {
        this.engine = null;
        this.characterController = null;
        this.selectedObject = null;
        this.objectMode = 'box';
        this.objects = [];
        this.multiplayerObjects = new Map();
    }

    async init(gameEngine) {
        this.engine = gameEngine;
        
        // Create town foundation
        this.createTownFoundation();
        
        // Create town infrastructure
        this.createTownInfrastructure();
        
        // Create skybox with urban atmosphere
        const skybox = this.engine.createSkybox();
        this.engine.scene.add(skybox);
        
        // Create character controller
        this.characterController = new CharacterController(this.engine.scene, this.engine.camera);
        
        // Set spawn position in the town square
        this.characterController.position.set(0, 2, 0);
        this.characterController.mesh.position.copy(this.characterController.position);
        
        // Build the town with buildings, roads, and features
        this.createTownEnvironment();
        
        // Setup mouse events for object interaction
        this.setupMouseEvents();
        
        // Initialize multiplayer object tracking
        this.multiplayerObjects = new Map();
        
        console.log('Town world initialized');
        console.log('=== WELCOME TO THE TOWN ===');
        console.log('You spawned in the town square with the fountain!');
        console.log('');
        console.log('🚶 Movement Controls:');
        console.log('  WASD - Walk around');
        console.log('  Space - Jump');
        console.log('  Mouse - Look around');
        console.log('');
        console.log('🏗️ Building Controls:');
        console.log('  Left Click - Place building');
        console.log('  Right Click - Remove building');
        console.log('');
        console.log('🏠 Building Types (Press number keys):');
        console.log('  1 = House     2 = Shop      3 = Tower');
        console.log('  4 = Park      5 = Road      6 = Decoration');
        console.log('');
        console.log('🌟 Explore the town and build with friends!');
    }

    createTownFoundation() {
        // Create main town ground
        const townGround = this.engine.createGround(300, 0x556B2F);
        this.engine.scene.add(townGround);
        
        // Create elevated town center platform
        const centerPlatform = this.engine.createBox(50, 0x708090, { x: 0, y: 0.5, z: 0 });
        centerPlatform.scale.set(1, 0.2, 1);
        this.engine.scene.add(centerPlatform);
        this.objects.push(centerPlatform);
    }

    createTownInfrastructure() {
        // Create main roads in a grid pattern
        this.createRoadSystem();
        
        // Create sidewalks
        this.createSidewalks();
        
        // Add street lighting
        this.createStreetLights();
        
        // Create town square fountain
        this.createTownSquare();
    }

    createRoadSystem() {
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        
        // Main roads (North-South and East-West)
        const mainRoads = [
            // North-South main road
            { pos: [0, 0.02, 0], size: [8, 0.1, 150], rotation: [0, 0, 0] },
            // East-West main road  
            { pos: [0, 0.02, 0], size: [150, 0.1, 8], rotation: [0, 0, 0] },
            // Secondary roads
            { pos: [40, 0.02, 0], size: [6, 0.1, 120], rotation: [0, 0, 0] },
            { pos: [-40, 0.02, 0], size: [6, 0.1, 120], rotation: [0, 0, 0] },
            { pos: [0, 0.02, 40], size: [120, 0.1, 6], rotation: [0, 0, 0] },
            { pos: [0, 0.02, -40], size: [120, 0.1, 6], rotation: [0, 0, 0] }
        ];

        mainRoads.forEach(road => {
            const geometry = new THREE.BoxGeometry(...road.size);
            const roadMesh = new THREE.Mesh(geometry, roadMaterial);
            roadMesh.position.set(...road.pos);
            roadMesh.receiveShadow = true;
            this.engine.scene.add(roadMesh);
            this.objects.push(roadMesh);
        });

        // Add road markings
        this.createRoadMarkings();
    }

    createRoadMarkings() {
        const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        
        // Center line stripes for main roads
        for (let i = -70; i <= 70; i += 8) {
            // North-South road stripes
            const stripe1 = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 4),
                stripeMaterial
            );
            stripe1.rotation.x = -Math.PI / 2;
            stripe1.position.set(0, 0.03, i);
            this.engine.scene.add(stripe1);
            
            // East-West road stripes
            const stripe2 = new THREE.Mesh(
                new THREE.PlaneGeometry(4, 0.3),
                stripeMaterial
            );
            stripe2.rotation.x = -Math.PI / 2;
            stripe2.position.set(i, 0.03, 0);
            this.engine.scene.add(stripe2);
        }
    }

    createSidewalks() {
        const sidewalkMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        
        // Sidewalks along main roads
        const sidewalks = [
            // Along North-South road
            { pos: [6, 0.04, 0], size: [2, 0.08, 150] },
            { pos: [-6, 0.04, 0], size: [2, 0.08, 150] },
            // Along East-West road
            { pos: [0, 0.04, 6], size: [150, 0.08, 2] },
            { pos: [0, 0.04, -6], size: [150, 0.08, 2] }
        ];

        sidewalks.forEach(walk => {
            const geometry = new THREE.BoxGeometry(...walk.size);
            const sidewalk = new THREE.Mesh(geometry, sidewalkMaterial);
            sidewalk.position.set(...walk.pos);
            sidewalk.receiveShadow = true;
            this.engine.scene.add(sidewalk);
            this.objects.push(sidewalk);
        });
    }

    createStreetLights() {
        const positions = [
            [20, 20], [20, -20], [-20, 20], [-20, -20],
            [60, 0], [-60, 0], [0, 60], [0, -60],
            [40, 40], [40, -40], [-40, 40], [-40, -40]
        ];

        positions.forEach(pos => {
            this.createStreetLight(pos[0], pos[1]);
        });
    }

    createStreetLight(x, z) {
        // Light pole
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, 4, z);
        pole.castShadow = true;
        this.engine.scene.add(pole);
        this.objects.push(pole);

        // Light fixture
        const lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const lightMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFAA,
            emissive: 0x222200
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(x, 7.5, z);
        this.engine.scene.add(light);
        this.objects.push(light);

        // Add actual light source
        const pointLight = new THREE.PointLight(0xFFFFAA, 0.5, 20);
        pointLight.position.set(x, 7.5, z);
        pointLight.castShadow = true;
        this.engine.scene.add(pointLight);
    }

    createTownSquare() {
        // Central fountain
        const fountainBase = new THREE.CylinderGeometry(3, 3, 1);
        const fountainMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
        const fountain = new THREE.Mesh(fountainBase, fountainMaterial);
        fountain.position.set(0, 0.5, 0);
        fountain.castShadow = true;
        fountain.receiveShadow = true;
        this.engine.scene.add(fountain);
        this.objects.push(fountain);

        // Fountain center pillar
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2);
        const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(0, 2, 0);
        pillar.castShadow = true;
        this.engine.scene.add(pillar);
        this.objects.push(pillar);

        // Benches around the square
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * 8;
            const z = Math.sin(angle) * 8;
            this.createBench(x, z, angle);
        }
    }

    createBench(x, z, rotation) {
        const benchGroup = new THREE.Group();
        
        // Bench seat
        const seatGeometry = new THREE.BoxGeometry(3, 0.3, 1);
        const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const seat = new THREE.Mesh(seatGeometry, benchMaterial);
        seat.position.y = 1;
        seat.castShadow = true;
        benchGroup.add(seat);

        // Bench back
        const backGeometry = new THREE.BoxGeometry(3, 1.5, 0.2);
        const back = new THREE.Mesh(backGeometry, benchMaterial);
        back.position.set(0, 1.5, -0.4);
        back.castShadow = true;
        benchGroup.add(back);

        // Bench legs
        const legGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        
        [-1.2, 1.2].forEach(x_offset => {
            [0.3, -0.3].forEach(z_offset => {
                const leg = new THREE.Mesh(legGeometry, legMaterial);
                leg.position.set(x_offset, 0.5, z_offset);
                leg.castShadow = true;
                benchGroup.add(leg);
            });
        });

        benchGroup.position.set(x, 0, z);
        benchGroup.rotation.y = rotation;
        this.engine.scene.add(benchGroup);
        this.objects.push(benchGroup);
    }

    createTownEnvironment() {
        // Create residential district
        this.createResidentialArea();
        
        // Create commercial district
        this.createCommercialArea();
        
        // Create industrial area
        this.createIndustrialArea();
        
        // Create parks and recreation
        this.createParksAndRecreation();
        
        // Add vehicles parked around town
        this.createParkedVehicles();
        
        // Add town decorations
        this.createTownDecorations();
    }

    createResidentialArea() {
        // Create houses in a suburban layout
        const housePositions = [
            { x: 25, z: 25 }, { x: 35, z: 25 }, { x: 45, z: 25 },
            { x: 25, z: 35 }, { x: 35, z: 35 }, { x: 45, z: 35 },
            { x: -25, z: 25 }, { x: -35, z: 25 }, { x: -45, z: 25 },
            { x: -25, z: 35 }, { x: -35, z: 35 }, { x: -45, z: 35 },
            { x: 25, z: -25 }, { x: 35, z: -25 }, { x: 45, z: -25 },
            { x: 25, z: -35 }, { x: 35, z: -35 }, { x: 45, z: -35 }
        ];

        housePositions.forEach((pos, index) => {
            this.createHouse(pos.x, pos.z, index);
        });
    }

    createHouse(x, z, styleIndex) {
        const houseGroup = new THREE.Group();
        const colors = [0xF4A460, 0xDEB887, 0xD2B48C, 0xBC8F8F, 0xF5DEB3];
        const roofColors = [0x8B0000, 0x228B22, 0x4682B4, 0x8B4513, 0x2F4F4F];
        
        const houseColor = colors[styleIndex % colors.length];
        const roofColor = roofColors[styleIndex % roofColors.length];

        // House foundation
        const foundation = this.engine.createBox(6, 0x696969, { x: 0, y: 0.25, z: 0 });
        foundation.scale.set(1, 0.1, 1);
        houseGroup.add(foundation);

        // House walls
        const walls = this.engine.createBox(5, houseColor, { x: 0, y: 2, z: 0 });
        walls.scale.set(1, 0.8, 1);
        houseGroup.add(walls);

        // Roof
        const roofGeometry = new THREE.ConeGeometry(4, 3, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: roofColor });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 4.5, 0);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        houseGroup.add(roof);

        // Door
        const doorGeometry = new THREE.BoxGeometry(1, 2, 0.1);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1, 2.55);
        door.castShadow = true;
        houseGroup.add(door);

        // Windows
        const windowGeometry = new THREE.BoxGeometry(1, 1, 0.1);
        const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
        
        // Front windows
        [-1.5, 1.5].forEach(x_offset => {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(x_offset, 2.5, 2.55);
            houseGroup.add(window);
        });

        // Side windows
        const sideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        sideWindow.position.set(2.55, 2.5, 0);
        houseGroup.add(sideWindow);

        // Chimney
        const chimneyGeometry = new THREE.BoxGeometry(0.8, 2, 0.8);
        const chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(1.5, 5.5, -1.5);
        chimney.castShadow = true;
        houseGroup.add(chimney);

        houseGroup.position.set(x, 0, z);
        this.engine.scene.add(houseGroup);
        this.objects.push(houseGroup);
    }

    createCommercialArea() {
        // Create shops and commercial buildings
        const shopPositions = [
            { x: -25, z: -25, type: 'shop' },
            { x: -35, z: -25, type: 'restaurant' },
            { x: -45, z: -25, type: 'bank' },
            { x: -55, z: -25, type: 'store' }
        ];

        shopPositions.forEach(pos => {
            this.createCommercialBuilding(pos.x, pos.z, pos.type);
        });
    }

    createCommercialBuilding(x, z, type) {
        const buildingGroup = new THREE.Group();
        
        let buildingColor, height, width;
        switch(type) {
            case 'shop':
                buildingColor = 0xFF6347;
                height = 4;
                width = 8;
                break;
            case 'restaurant':
                buildingColor = 0xFFD700;
                height = 5;
                width = 10;
                break;
            case 'bank':
                buildingColor = 0x4682B4;
                height = 8;
                width = 12;
                break;
            default:
                buildingColor = 0x9370DB;
                height = 6;
                width = 9;
        }

        // Building base
        const building = this.engine.createBox(width, buildingColor, { x: 0, y: height/2, z: 0 });
        building.scale.set(1, height/2, 0.8);
        buildingGroup.add(building);

        // Store front
        const storeFront = this.engine.createBox(width - 2, 0x2F2F2F, { x: 0, y: 1, z: 4 });
        storeFront.scale.set(0.8, 0.4, 0.1);
        buildingGroup.add(storeFront);

        // Sign
        const signGeometry = new THREE.BoxGeometry(width - 1, 1, 0.2);
        const signMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, height + 0.5, 0);
        sign.castShadow = true;
        buildingGroup.add(sign);

        buildingGroup.position.set(x, 0, z);
        this.engine.scene.add(buildingGroup);
        this.objects.push(buildingGroup);
    }

    createIndustrialArea() {
        // Create industrial buildings and warehouses
        const industrialPositions = [
            { x: 70, z: 70 },
            { x: 85, z: 70 },
            { x: 70, z: 85 }
        ];

        industrialPositions.forEach(pos => {
            this.createWarehouse(pos.x, pos.z);
        });

        // Add smokestacks
        this.createSmokestack(75, 60);
        this.createSmokestack(90, 60);
    }

    createWarehouse(x, z) {
        const warehouseGroup = new THREE.Group();

        // Main warehouse building
        const warehouse = this.engine.createBox(15, 0x708090, { x: 0, y: 6, z: 0 });
        warehouse.scale.set(1, 0.8, 1.2);
        warehouseGroup.add(warehouse);

        // Corrugated roof
        const roofGeometry = new THREE.BoxGeometry(16, 0.5, 19);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 11, 0);
        roof.castShadow = true;
        warehouseGroup.add(roof);

        // Loading dock
        const dockGeometry = new THREE.BoxGeometry(4, 4, 2);
        const dockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const dock = new THREE.Mesh(dockGeometry, dockMaterial);
        dock.position.set(0, 2, 10);
        dock.castShadow = true;
        warehouseGroup.add(dock);

        warehouseGroup.position.set(x, 0, z);
        this.engine.scene.add(warehouseGroup);
        this.objects.push(warehouseGroup);
    }

    createSmokestack(x, z) {
        const stackGeometry = new THREE.CylinderGeometry(1, 1.5, 20);
        const stackMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const stack = new THREE.Mesh(stackGeometry, stackMaterial);
        stack.position.set(x, 10, z);
        stack.castShadow = true;
        this.engine.scene.add(stack);
        this.objects.push(stack);

        // Smoke effect (simple gray spheres)
        for (let i = 0; i < 3; i++) {
            const smokeGeometry = new THREE.SphereGeometry(0.5 + i * 0.3, 8, 8);
            const smokeMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x808080, 
                transparent: true, 
                opacity: 0.3 - i * 0.1 
            });
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.set(x + (Math.random() - 0.5) * 2, 20 + i * 2, z + (Math.random() - 0.5) * 2);
            this.engine.scene.add(smoke);
        }
    }

    createParksAndRecreation() {
        // Create a large park
        this.createPark(-70, -70);
        
        // Create playground
        this.createPlayground(-80, -50);
        
        // Create basketball court
        this.createBasketballCourt(60, -70);
    }

    createPark(x, z) {
        const parkGroup = new THREE.Group();

        // Park grass area
        const grassGeometry = new THREE.PlaneGeometry(25, 25);
        const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.set(0, 0.01, 0);
        grass.receiveShadow = true;
        parkGroup.add(grass);

        // Park trees
        for (let i = 0; i < 8; i++) {
            const treeX = (Math.random() - 0.5) * 20;
            const treeZ = (Math.random() - 0.5) * 20;
            
            // Tree trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(treeX, 2, treeZ);
            trunk.castShadow = true;
            parkGroup.add(trunk);

            // Tree leaves
            const leavesGeometry = new THREE.SphereGeometry(2, 8, 8);
            const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.set(treeX, 5, treeZ);
            leaves.castShadow = true;
            parkGroup.add(leaves);
        }

        // Park path
        const pathGeometry = new THREE.PlaneGeometry(2, 25);
        const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.02, 0);
        parkGroup.add(path);

        parkGroup.position.set(x, 0, z);
        this.engine.scene.add(parkGroup);
        this.objects.push(parkGroup);
    }

    createPlayground(x, z) {
        const playgroundGroup = new THREE.Group();

        // Swing set
        const swingPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        
        [-2, 2].forEach(poleX => {
            const pole = new THREE.Mesh(swingPoleGeometry, poleMaterial);
            pole.position.set(poleX, 1.5, 0);
            pole.castShadow = true;
            playgroundGroup.add(pole);
        });

        // Swing seats
        [-1, 1].forEach(seatX => {
            const seatGeometry = new THREE.BoxGeometry(1, 0.1, 0.5);
            const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const seat = new THREE.Mesh(seatGeometry, seatMaterial);
            seat.position.set(seatX, 1, 0);
            seat.castShadow = true;
            playgroundGroup.add(seat);
        });

        // Slide
        const slideBaseGeometry = new THREE.BoxGeometry(2, 3, 3);
        const slideBaseMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        const slideBase = new THREE.Mesh(slideBaseGeometry, slideBaseMaterial);
        slideBase.position.set(5, 1.5, 0);
        slideBase.castShadow = true;
        playgroundGroup.add(slideBase);

        playgroundGroup.position.set(x, 0, z);
        this.engine.scene.add(playgroundGroup);
        this.objects.push(playgroundGroup);
    }

    createBasketballCourt(x, z) {
        const courtGroup = new THREE.Group();

        // Court surface
        const courtGeometry = new THREE.PlaneGeometry(15, 25);
        const courtMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const court = new THREE.Mesh(courtGeometry, courtMaterial);
        court.rotation.x = -Math.PI / 2;
        court.position.set(0, 0.01, 0);
        court.receiveShadow = true;
        courtGroup.add(court);

        // Basketball hoops
        [-12, 12].forEach(hoopZ => {
            // Hoop pole
            const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(0, 2.5, hoopZ);
            pole.castShadow = true;
            courtGroup.add(pole);

            // Backboard
            const backboardGeometry = new THREE.BoxGeometry(3, 2, 0.1);
            const backboardMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
            backboard.position.set(0, 4, hoopZ);
            backboard.castShadow = true;
            courtGroup.add(backboard);

            // Rim
            const rimGeometry = new THREE.TorusGeometry(0.5, 0.05, 8, 16);
            const rimMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.position.set(0, 3.5, hoopZ - 0.5);
            rim.rotation.x = Math.PI / 2;
            courtGroup.add(rim);
        });

        courtGroup.position.set(x, 0, z);
        this.engine.scene.add(courtGroup);
        this.objects.push(courtGroup);
    }

    createParkedVehicles() {
        // Add some parked cars around the town
        const carPositions = [
            { x: 15, z: 20 }, { x: 15, z: 30 }, { x: 55, z: 20 },
            { x: -15, z: 20 }, { x: -15, z: 30 }, { x: -55, z: 20 }
        ];

        carPositions.forEach((pos, index) => {
            this.createParkedCar(pos.x, pos.z, index);
        });
    }

    createParkedCar(x, z, styleIndex) {
        const carGroup = new THREE.Group();
        const colors = [0xff0000, 0x0066ff, 0x00ff66, 0xffff00, 0xff00ff, 0x444444];
        const carColor = colors[styleIndex % colors.length];

        // Car body
        const bodyGeometry = new THREE.BoxGeometry(3, 1, 1.5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: carColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.7;
        body.castShadow = true;
        carGroup.add(body);

        // Car wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        
        const wheelPositions = [
            { x: -1, y: 0.3, z: 0.6 }, { x: 1, y: 0.3, z: 0.6 },
            { x: -1, y: 0.3, z: -0.6 }, { x: 1, y: 0.3, z: -0.6 }
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            carGroup.add(wheel);
        });

        carGroup.position.set(x, 0, z);
        carGroup.rotation.y = Math.random() * Math.PI * 2;
        this.engine.scene.add(carGroup);
        this.objects.push(carGroup);
    }

    createTownDecorations() {
        // Add traffic lights
        this.createTrafficLight(10, 10);
        this.createTrafficLight(-10, 10);
        this.createTrafficLight(10, -10);
        this.createTrafficLight(-10, -10);

        // Add fire hydrants
        for (let i = 0; i < 6; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            this.createFireHydrant(x, z);
        }

        // Add mailboxes
        for (let i = 0; i < 8; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            this.createMailbox(x, z);
        }
    }

    createTrafficLight(x, z) {
        const lightGroup = new THREE.Group();

        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 2;
        pole.castShadow = true;
        lightGroup.add(pole);

        // Light box
        const boxGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.y = 4.5;
        box.castShadow = true;
        lightGroup.add(box);

        // Lights (red, yellow, green)
        const lightColors = [0xff0000, 0xffff00, 0x00ff00];
        lightColors.forEach((color, index) => {
            const lightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const lightMaterial = new THREE.MeshLambertMaterial({ color: color });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(0, 5 - index * 0.4, 0.3);
            lightGroup.add(light);
        });

        lightGroup.position.set(x, 0, z);
        this.engine.scene.add(lightGroup);
        this.objects.push(lightGroup);
    }

    createFireHydrant(x, z) {
        const hydrantGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1);
        const hydrantMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const hydrant = new THREE.Mesh(hydrantGeometry, hydrantMaterial);
        hydrant.position.set(x, 0.5, z);
        hydrant.castShadow = true;
        this.engine.scene.add(hydrant);
        this.objects.push(hydrant);
    }

    createMailbox(x, z) {
        const mailboxGroup = new THREE.Group();

        // Post
        const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = 0.75;
        post.castShadow = true;
        mailboxGroup.add(post);

        // Box
        const boxGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.4);
        const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x4682B4 });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.y = 1.3;
        box.castShadow = true;
        mailboxGroup.add(box);

        mailboxGroup.position.set(x, 0, z);
        this.engine.scene.add(mailboxGroup);
        this.objects.push(mailboxGroup);
    }

    setupMouseEvents() {
        const canvas = document.getElementById('game-canvas');
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        canvas.addEventListener('click', (event) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Cast ray from camera
            raycaster.setFromCamera(mouse, this.engine.camera);
            
            // Check for intersections with ground
            const ground = this.engine.scene.children.find(child => 
                child.geometry && child.geometry.type === 'PlaneGeometry'
            );
            
            if (ground) {
                const intersects = raycaster.intersectObject(ground);
                if (intersects.length > 0) {
                    this.addObjectAtPosition(intersects[0].point);
                }
            }
        });
        
        // Right click to remove objects
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.engine.camera);
            
            const intersects = raycaster.intersectObjects(this.objects);
            if (intersects.length > 0) {
                this.removeObject(intersects[0].object);
            }
        });
    }

    addObjectAtPosition(position) {
        let newObject;
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500, 0x800080];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        switch (this.objectMode) {
            case 'house':
                newObject = this.createQuickHouse(position.x, position.z, Math.floor(Math.random() * 5));
                break;
            case 'shop':
                newObject = this.createQuickShop(position.x, position.z, randomColor);
                break;
            case 'tower':
                newObject = this.createQuickTower(position.x, position.z, randomColor);
                break;
            case 'park':
                newObject = this.createQuickPark(position.x, position.z);
                break;
            case 'road':
                newObject = this.createQuickRoad(position.x, position.z);
                break;
            case 'decoration':
                newObject = this.createQuickDecoration(position.x, position.z, randomColor);
                break;
        }
        
        if (newObject) {
            this.engine.scene.add(newObject);
            this.objects.push(newObject);
            
            // Send multiplayer update for object creation
            if (this.engine.socket && this.engine.socket.readyState === WebSocket.OPEN) {
                this.engine.socket.send(JSON.stringify({
                    type: 'objectAdded',
                    objectData: {
                        type: this.objectMode,
                        position: newObject.position,
                        scale: newObject.scale,
                        color: randomColor
                    }
                }));
            }
        }
    }

    createQuickHouse(x, z, style) {
        const houseGroup = new THREE.Group();
        const colors = [0xF4A460, 0xDEB887, 0xD2B48C, 0xBC8F8F, 0xF5DEB3];
        const roofColors = [0x8B0000, 0x228B22, 0x4682B4, 0x8B4513, 0x2F4F4F];
        
        const houseColor = colors[style % colors.length];
        const roofColor = roofColors[style % roofColors.length];

        // Simple house walls
        const walls = this.engine.createBox(4, houseColor, { x: 0, y: 1.5, z: 0 });
        houseGroup.add(walls);

        // Simple roof
        const roofGeometry = new THREE.ConeGeometry(3, 2, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: roofColor });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 3, 0);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        houseGroup.add(roof);

        houseGroup.position.set(x, 0, z);
        return houseGroup;
    }

    createQuickShop(x, z, color) {
        const shopGroup = new THREE.Group();

        // Shop building
        const building = this.engine.createBox(5, color, { x: 0, y: 2, z: 0 });
        shopGroup.add(building);

        // Shop sign
        const signGeometry = new THREE.BoxGeometry(4, 0.8, 0.2);
        const signMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 3.5, 0);
        sign.castShadow = true;
        shopGroup.add(sign);

        shopGroup.position.set(x, 0, z);
        return shopGroup;
    }

    createQuickTower(x, z, color) {
        const towerGroup = new THREE.Group();

        // Tower base
        const base = this.engine.createBox(3, color, { x: 0, y: 1, z: 0 });
        towerGroup.add(base);

        // Tower middle
        const middle = this.engine.createBox(2.5, color, { x: 0, y: 3, z: 0 });
        towerGroup.add(middle);

        // Tower top
        const top = this.engine.createBox(2, color, { x: 0, y: 5, z: 0 });
        towerGroup.add(top);

        // Tower spire
        const spireGeometry = new THREE.ConeGeometry(1, 2, 8);
        const spireMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.position.set(0, 7, 0);
        spire.castShadow = true;
        towerGroup.add(spire);

        towerGroup.position.set(x, 0, z);
        return towerGroup;
    }

    createQuickPark(x, z) {
        const parkGroup = new THREE.Group();

        // Park grass
        const grassGeometry = new THREE.PlaneGeometry(8, 8);
        const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.set(0, 0.01, 0);
        grass.receiveShadow = true;
        parkGroup.add(grass);

        // Park tree
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(0, 1, 0);
        trunk.castShadow = true;
        parkGroup.add(trunk);

        const leavesGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(0, 2.5, 0);
        leaves.castShadow = true;
        parkGroup.add(leaves);

        parkGroup.position.set(x, 0, z);
        return parkGroup;
    }

    createQuickRoad(x, z) {
        const roadGeometry = new THREE.PlaneGeometry(4, 4);
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.set(x, 0.02, z);
        road.receiveShadow = true;
        return road;
    }

    createQuickDecoration(x, z, color) {
        const decorationGroup = new THREE.Group();

        // Random decoration type
        const decorationType = Math.floor(Math.random() * 3);
        
        switch (decorationType) {
            case 0: // Lamppost
                const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
                const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
                const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.position.set(0, 1.5, 0);
                pole.castShadow = true;
                decorationGroup.add(pole);

                const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
                const lightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFAA });
                const light = new THREE.Mesh(lightGeometry, lightMaterial);
                light.position.set(0, 2.8, 0);
                decorationGroup.add(light);
                break;
                
            case 1: // Statue
                const statueGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2);
                const statueMaterial = new THREE.MeshLambertMaterial({ color: color });
                const statue = new THREE.Mesh(statueGeometry, statueMaterial);
                statue.position.set(0, 1, 0);
                statue.castShadow = true;
                decorationGroup.add(statue);
                break;
                
            case 2: // Flower bed
                const bedGeometry = new THREE.CylinderGeometry(1, 1, 0.3);
                const bedMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const bed = new THREE.Mesh(bedGeometry, bedMaterial);
                bed.position.set(0, 0.15, 0);
                bed.castShadow = true;
                decorationGroup.add(bed);

                // Flowers
                for (let i = 0; i < 4; i++) {
                    const flowerGeometry = new THREE.SphereGeometry(0.1, 6, 6);
                    const flowerMaterial = new THREE.MeshLambertMaterial({ color: color });
                    const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
                    const angle = (i / 4) * Math.PI * 2;
                    flower.position.set(Math.cos(angle) * 0.5, 0.4, Math.sin(angle) * 0.5);
                    decorationGroup.add(flower);
                }
                break;
        }

        decorationGroup.position.set(x, 0, z);
        return decorationGroup;
    }
    
    createCylinder(radius, height, color, position) {
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 12);
        const material = new THREE.MeshLambertMaterial({ color: color });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.set(position.x, position.y, position.z);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        return cylinder;
    }
    
    createPyramid(size, color, position) {
        const geometry = new THREE.ConeGeometry(size, size * 1.5, 4);
        const material = new THREE.MeshLambertMaterial({ color: color });
        const pyramid = new THREE.Mesh(geometry, material);
        pyramid.position.set(position.x, position.y, position.z);
        pyramid.castShadow = true;
        pyramid.receiveShadow = true;
        return pyramid;
    }

    removeObject(object) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
            this.engine.scene.remove(object);
            
            // Send multiplayer update for object removal
            if (this.engine.socket && this.engine.socket.readyState === WebSocket.OPEN) {
                this.engine.socket.send(JSON.stringify({
                    type: 'objectRemoved',
                    objectId: object.uuid
                }));
            }
        }
    }

    update(deltaTime, keys) {
        // Update character controller first
        if (this.characterController) {
            this.characterController.update(deltaTime, keys);
            
            // Send multiplayer update for character position
            if (this.engine && this.engine.sendPlayerUpdate) {
                this.engine.sendPlayerUpdate(
                    this.characterController.position, 
                    this.characterController.rotation, 
                    { type: 'sandbox' }
                );
            }
        }
        
        // Switch building types with number keys
        if (keys['Digit1']) this.objectMode = 'house';
        if (keys['Digit2']) this.objectMode = 'shop';
        if (keys['Digit3']) this.objectMode = 'tower';
        if (keys['Digit4']) this.objectMode = 'park';
        if (keys['Digit5']) this.objectMode = 'road';
        if (keys['Digit6']) this.objectMode = 'decoration';
        
        // Simple physics simulation for objects
        this.updatePhysics(deltaTime);
        
        // Update multiplayer objects
        this.updateMultiplayerObjects();
    }
    
    updateMultiplayerObjects() {
        // Handle other players' building activities
        this.engine.players.forEach((player, playerId) => {
            if (playerId !== this.engine.playerId && player.userData && player.userData.type === 'sandbox') {
                // Show other players as character models
                if (!this.multiplayerObjects.has(playerId)) {
                    this.createOtherPlayerCharacter(playerId);
                }
                
                const otherPlayer = this.multiplayerObjects.get(playerId);
                if (otherPlayer) {
                    otherPlayer.position.lerp(player.position, 0.1);
                    otherPlayer.rotation.y += (player.rotation.y - otherPlayer.rotation.y) * 0.1;
                }
            }
        });
    }
    
    createOtherPlayerCharacter(playerId) {
        // Create a character representation for other players
        const colors = [0x0066ff, 0x00ff66, 0xff6600, 0xff0066, 0x6600ff, 0xffff00];
        const playerColor = colors[parseInt(playerId.slice(-1), 16) % colors.length];
        
        const characterGroup = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: playerColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        body.castShadow = true;
        characterGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.9;
        head.castShadow = true;
        characterGroup.add(head);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
        const armMaterial = new THREE.MeshLambertMaterial({ color: playerColor });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.6, 0.8, 0);
        leftArm.castShadow = true;
        characterGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.6, 0.8, 0);
        rightArm.castShadow = true;
        characterGroup.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, -0.5, 0);
        leftLeg.castShadow = true;
        characterGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, -0.5, 0);
        rightLeg.castShadow = true;
        characterGroup.add(rightLeg);
        
        this.engine.scene.add(characterGroup);
        this.multiplayerObjects.set(playerId, characterGroup);
        
        // Add player name tag
        this.addPlayerNameTag(characterGroup, playerId);
    }
    
    addPlayerNameTag(character, playerId) {
        // Create a simple text sprite for player name
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText(playerId.substring(0, 12), canvas.width / 2, canvas.height / 2 + 6);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(0, 3, 0);
        sprite.scale.set(3, 0.75, 1);
        
        character.add(sprite);
    }

    updatePhysics(deltaTime) {
        this.objects.forEach(object => {
            // Simple gravity
            if (object.position.y > 0.5) {
                object.userData.velocity = object.userData.velocity || new THREE.Vector3();
                object.userData.velocity.y -= 20 * deltaTime; // Gravity
                object.position.add(object.userData.velocity.clone().multiplyScalar(deltaTime));
                
                // Ground collision
                if (object.position.y <= 0.5) {
                    object.position.y = 0.5;
                    object.userData.velocity.y = 0;
                }
            }
        });
    }

    cleanup() {
        // Clean up all objects
        this.objects.forEach(object => {
            this.engine.scene.remove(object);
        });
        this.objects = [];
        
        // Clean up multiplayer objects
        this.multiplayerObjects.forEach(obj => {
            this.engine.scene.remove(obj);
        });
        this.multiplayerObjects.clear();
        
        // Remove character controller
        if (this.characterController && this.characterController.mesh) {
            this.engine.scene.remove(this.characterController.mesh);
        }
        
        console.log('Sandbox world cleaned up');
    }
}

export default new SandboxGame();
