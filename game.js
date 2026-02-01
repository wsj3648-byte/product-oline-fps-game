// Initialize Socket.IO connection (assuming server is running and accessible)
// Note: If the server is not running on the same host/port as the client, you'll need to specify it.
// For now, assume it's accessible.
const socket = io('https://product-oline-fps-game.wsj3648-daa.workers.dev');

// --- Three.js Setup (existing) ---
function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);

    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // camera position will be handled by player attachment later

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#AAAAAA');

    // Lighting (existing)
    {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.2));

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        scene.add(directionalLight);
        scene.add(directionalLight.target);
    }

    // Ground - Sand color (existing)
    {
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C }); // Sand color
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
    }

    // Walls and Boxes - Inspired by de_dust2 (existing)
    const createBox = (width, height, depth, color, position) => {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    };

    const wallColor = 0xBEB4A4; // A light stone/sand color for walls
    const boxColor = 0x8B4513;   // A brownish color for crates

    // Main wall structures
    createBox(20, 10, 1, wallColor, new THREE.Vector3(0, 5, -10));
    createBox(1, 10, 20, wallColor, new THREE.Vector3(10, 5, 0));
    createBox(15, 8, 1, wallColor, new THREE.Vector3(-2.5, 4, 5));
    createBox(1, 8, 10, wallColor, new THREE.Vector3(-10, 4, 0));

    // Crates/Boxes
    createBox(4, 4, 4, boxColor, new THREE.Vector3(0, 2, 0));
    createBox(3, 3, 3, boxColor, new THREE.Vector3(5, 1.5, -2));
    createBox(2, 2, 2, boxColor, new THREE.Vector3(-5, 1, 2));

    // --- FPS Controls and Player Setup ---
    // Enable pointer lock for FPS controls
    document.body.requestPointerLock = document.body.requestPointerLock ||
                                      document.body.mozRequestPointerLock ||
                                      document.body.webkitRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock ||
                               document.exitPointerLock ||
                               document.exitPointerLock;

    let controlsEnabled = false;
    document.addEventListener('click', () => {
        if (!controlsEnabled) { // Only request if not already locked
            document.body.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        controlsEnabled = document.pointerLockElement === document.body;
    });
    document.addEventListener('mozpointerlockchange', () => {
        controlsEnabled = document.mozPointerLockElement === document.body;
    });
    document.addEventListener('webkitpointerlockchange', () => {
        controlsEnabled = document.webkitPointerLockElement === document.body;
    });

    // Player setup
    const playerHeight = 1.8; // Approximate height of a person
    const playerRadius = 0.3;
    const playerGeometry = new THREE.BoxGeometry(playerRadius * 2, playerHeight, playerRadius * 2);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = playerHeight / 2; // Start on the ground
    scene.add(player);

    // Attach camera to player
    player.add(camera);


    // Movement variables
    const moveSpeed = 0.1;
    const rotationSpeed = 0.002;
    const keyboard = {};
    document.addEventListener('keydown', (event) => {
        keyboard[event.code] = true;
    });
    document.addEventListener('keyup', (event) => {
        keyboard[event.code] = false;
    });

    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (event) => {
        if (controlsEnabled) {
            mouseX += event.movementX * rotationSpeed;
            mouseY += event.movementY * rotationSpeed;

            // Clamp vertical rotation to prevent flipping
            mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY));
        }
    });

    // --- UI Update Logic ---
    let playerHealth = 100;
    const healthDisplay = document.getElementById('healthDisplay');

    function updateHealthDisplay() {
        healthDisplay.textContent = `Health: ${playerHealth}`;
        if (playerHealth <= 25) {
            healthDisplay.style.color = 'red';
        } else if (playerHealth <= 50) {
            healthDisplay.style.color = 'orange';
        } else {
            healthDisplay.style.color = 'white';
        }
    }
    updateHealthDisplay(); // Initial display

    // Scoreboard
    const scoreboard = document.getElementById('scoreboard');
    const scoreboardTableBody = document.getElementById('scoreboardTable').getElementsByTagName('tbody')[0];
    const playersScores = {}; // Stores { socketId: { kills, deaths } }

    function updateScoreboard() {
        // Clear existing rows
        scoreboardTableBody.innerHTML = '';

        // Convert to array and sort by kills descending, then deaths ascending
        const sortedPlayers = Object.entries(playersScores).sort(([, a], [, b]) => {
            if (a.kills !== b.kills) {
                return b.kills - a.kills; // Kills descending
            }
            return a.deaths - b.deaths; // Deaths ascending
        });

        sortedPlayers.forEach(([id, score]) => {
            const row = scoreboardTableBody.insertRow();
            const idCell = row.insertCell();
            const killsCell = row.insertCell();
            const deathsCell = row.insertCell();

            idCell.textContent = id === socket.id ? `You (${id})` : id;
            killsCell.textContent = score.kills;
            deathsCell.textContent = score.deaths;
        });
    }

    // Toggle scoreboard on Tab key
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Tab') {
            event.preventDefault(); // Prevent browser default behavior (e.g., focus change)
            scoreboard.style.display = scoreboard.style.display === 'block' ? 'none' : 'block';
        }
    });


    // --- Shooting Mechanism ---
    const bulletSpeed = 0.5;
    const bullets = []; // Array to store active bullets (local)
    let lastShotTime = 0;
    const weaponFireRate = 200; // ms between shots
    const weaponDamage = 25; // Damage per shot
    const bulletColor = 0xffff00;

    document.addEventListener('click', () => {
        if (controlsEnabled) { // Only shoot if controls are enabled (pointer locked)
            const currentTime = performance.now();
            if (currentTime - lastShotTime < weaponFireRate) {
                return; // Too fast, rate limit
            }
            lastShotTime = currentTime;

            // Calculate bullet direction from camera
            const bulletDirection = new THREE.Vector3();
            camera.getWorldDirection(bulletDirection);

            const bulletPosition = new THREE.Vector3();
            camera.getWorldPosition(bulletPosition); // Bullet originates from camera position

            // Create bullet mesh for local display
            const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const bulletMaterial = new THREE.MeshBasicMaterial({ color: bulletColor });
            const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
            bullet.position.copy(bulletPosition);
            scene.add(bullet);

            bullets.push({ mesh: bullet, direction: bulletDirection });

            // Emit shoot event to server
            socket.emit('shoot', {
                position: bulletPosition,
                direction: bulletDirection,
                damage: weaponDamage,
                bulletColor: bulletColor
            });
        }
    });


    // --- Multiplayer Logic ---
    const otherPlayers = {}; // Map to store other players' meshes (socket.id -> mesh)
    const remoteBullets = {}; // Map to store remote bullets { shooterId: [{mesh, direction}] }

    function createPlayerMesh(color = 0xff0000) { // Default color for other players
        const playerGeo = new THREE.BoxGeometry(playerRadius * 2, playerHeight, playerRadius * 2);
        const playerMat = new THREE.MeshStandardMaterial({ color: color });
        const playerMesh = new THREE.Mesh(playerGeo, playerMat);
        return playerMesh;
    }

    socket.on('currentPlayers', (playersData) => {
        Object.keys(playersData).forEach((id) => {
            if (id === socket.id) {
                // This is our player, update its position if it's the first time
                player.position.copy(playersData[id].position);
                player.rotation.y = playersData[id].rotation.y;
                camera.rotation.x = playersData[id].rotation.x; // Set initial camera pitch
                playerHealth = playersData[id].health; // Initialize our health
                updateHealthDisplay();
            } else {
                // Other players
                const otherPlayer = createPlayerMesh();
                otherPlayer.position.copy(playersData[id].position);
                otherPlayer.rotation.y = playersData[id].rotation.y;
                scene.add(otherPlayer);
                otherPlayers[id] = otherPlayer;
            }
            // Initialize scoreboard for all players
            playersScores[id] = { kills: playersData[id].kills, deaths: playersData[id].deaths };
        });
        updateScoreboard(); // Render scoreboard after all players are added
    });

    socket.on('newPlayer', (playerInfo) => {
        const otherPlayer = createPlayerMesh();
        otherPlayer.position.copy(playerInfo.position);
        otherPlayer.rotation.y = playerInfo.rotation.y;
        scene.add(otherPlayer);
        otherPlayers[playerInfo.id] = otherPlayer;
        // Add new player to scoreboard
        playersScores[playerInfo.id] = { kills: playerInfo.kills, deaths: playerInfo.deaths };
        updateScoreboard();
    });

    socket.on('playerMoved', (playerInfo) => {
        const otherPlayer = otherPlayers[playerInfo.id];
        if (otherPlayer) {
            otherPlayer.position.copy(playerInfo.position);
            otherPlayer.rotation.y = playerInfo.rotation.y;
        }
    });

    socket.on('playerHit', (data) => {
        // Only if it's our player who got hit
        playerHealth = data.health;
        updateHealthDisplay();
    });

    socket.on('playerDied', (data) => {
        if (data.playerId === socket.id) {
            // Our player died, server will handle respawn
            playerHealth = 0; // Show 0 health for immediate feedback
            updateHealthDisplay();
        } else {
            // Another player died
            const otherPlayer = otherPlayers[data.playerId];
            if (otherPlayer) {
                scene.remove(otherPlayer);
                otherPlayer.geometry.dispose();
                otherPlayer.material.dispose();
                delete otherPlayers[data.playerId];
            }
        }
    });

    socket.on('playerRespawned', (data) => {
        if (data.playerId === socket.id) {
            // Our player respawned
            player.position.copy(data.position);
            playerHealth = data.health;
            updateHealthDisplay();
            // Re-enable controls if they were disabled
            controlsEnabled = true;
        } else {
            // Another player respawned, re-add their mesh
            const otherPlayer = createPlayerMesh();
            otherPlayer.position.copy(data.position);
            otherPlayer.rotation.y = 0; // Reset rotation for respawn
            scene.add(otherPlayer);
            otherPlayers[data.playerId] = otherPlayer;
        }
    });

    socket.on('playerScoreUpdated', (playerInfo) => {
        playersScores[playerInfo.id] = { kills: playerInfo.kills, deaths: playerInfo.deaths };
        updateScoreboard();
    });

    socket.on('playerDisconnected', (playerId) => {
        const otherPlayer = otherPlayers[playerId];
        if (otherPlayer) {
            scene.remove(otherPlayer);
            otherPlayer.geometry.dispose();
            otherPlayer.material.dispose();
            delete otherPlayers[playerId];
        }
        // Remove from scoreboard
        delete playersScores[playerId];
        updateScoreboard();
    });

    socket.on('remoteBulletShot', (bulletData) => { // Server re-emits 'remoteBulletShot'
        if (!remoteBullets[bulletData.shooterId]) {
            remoteBullets[bulletData.shooterId] = [];
        }

        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: bulletData.bulletColor || 0xff0000 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(bulletData.position);
        scene.add(bullet);

        remoteBullets[bulletData.shooterId].push({
            mesh: bullet,
            direction: new THREE.Vector3().copy(bulletData.direction)
        });
    });


    let lastUpdateTime = 0;
    const updateInterval = 100; // milliseconds, send updates every 100ms

    // --- Animation Loop (existing, extended) ---
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function animate() {
        requestAnimationFrame(animate);

        if (controlsEnabled) {
            // Player movement
            const moveDirection = new THREE.Vector3();
            if (keyboard['KeyW']) moveDirection.z -= 1;
            if (keyboard['KeyS']) moveDirection.z += 1;
            if (keyboard['KeyA']) moveDirection.x -= 1;
            if (keyboard['KeyD']) moveDirection.x += 1;

            if (moveDirection.length() > 0) {
                moveDirection.normalize();
                // Apply rotation to the movement direction
                player.getWorldQuaternion(camera.quaternion); // Get camera orientation for movement
                moveDirection.applyQuaternion(camera.quaternion);
                player.position.addScaledVector(moveDirection, moveSpeed);
            }

            // Player rotation
            player.rotation.y = -mouseX;
            camera.rotation.x = -mouseY;

            // Send player state to server
            const now = performance.now();
            if (now - lastUpdateTime > updateInterval) {
                lastUpdateTime = now;
                socket.emit('playerMove', {
                    position: player.position,
                    rotation: { x: camera.rotation.x, y: player.rotation.y }
                });
            }
        }

        // Update local bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            bullet.mesh.position.addScaledVector(bullet.direction, bulletSpeed);
            // Remove bullet if it goes too far
            if (bullet.mesh.position.distanceTo(player.position) > 100) {
                scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                bullets.splice(i, 1);
            }
        }

        // Update remote bullets
        for (const shooterId in remoteBullets) {
            for (let i = remoteBullets[shooterId].length - 1; i >= 0; i--) {
                const bullet = remoteBullets[shooterId][i];
                bullet.mesh.position.addScaledVector(bullet.direction, bulletSpeed);
                // Simple removal for remote bullets as well
                if (bullet.mesh.position.distanceTo(player.position) > 100) { // Check distance from *our* player
                    scene.remove(bullet.mesh);
                    bullet.mesh.geometry.dispose();
                    bullet.mesh.material.dispose();
                    remoteBullets[shooterId].splice(i, 1);
                }
            }
        }

        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
}

main();