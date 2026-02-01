// Initialize Socket.IO
const socket = io();

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Enable pointer lock for FPS controls
document.body.requestPointerLock = document.body.requestPointerLock ||
                                  document.body.mozRequestPointerLock ||
                                  document.body.webkitRequestPointerLock;
document.exitPointerLock = document.exitPointerLock ||
                           document.exitPointerLock ||
                           document.exitPointerLock;

let controlsEnabled = false;
document.addEventListener('click', () => {
    document.body.requestPointerLock();
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
// Weapon Definitions
const weapons = [
    { name: "Pistol", damage: 25, fireRate: 200, bulletColor: 0xffff00 },
    { name: "Rifle", damage: 40, fireRate: 100, bulletColor: 0xffa500 },
    { name: "Shotgun", damage: 60, fireRate: 500, bulletColor: 0xff0000 }
];
let currentWeaponIndex = 0;
let currentWeapon = weapons[currentWeaponIndex];
let lastShotTime = 0;

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

const weaponDisplay = document.createElement('div');
weaponDisplay.id = 'weaponDisplay';
weaponDisplay.style.position = 'absolute';
weaponDisplay.style.top = '20px';
weaponDisplay.style.right = '20px';
weaponDisplay.style.color = 'white';
weaponDisplay.style.fontSize = '24px';
weaponDisplay.style.fontFamily = 'Arial, sans-serif';
weaponDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
weaponDisplay.style.padding = '10px';
weaponDisplay.style.borderRadius = '5px';
weaponDisplay.textContent = `Weapon: ${currentWeapon.name}`;
document.body.appendChild(weaponDisplay);

function updateWeaponDisplay() {
    weaponDisplay.textContent = `Weapon: ${currentWeapon.name}`;
}

// Player setup
const playerHeight = 1.8; // Approximate height of a person
const playerGeometry = new THREE.CapsuleGeometry(0.3, playerHeight / 2 - 0.3 * 2, 4); // Capsule for player body
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = playerHeight / 2;
scene.add(player);

// Attach camera to player
player.add(camera);
camera.position.set(0, playerHeight / 2 + 0.1, 0); // Position camera at eye level


// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Obstacles
const obstacles = [
    { x: 10, y: 2.5, z: -10, w: 5, h: 5, d: 5 },
    { x: -15, y: 3, z: 5, w: 6, h: 6, d: 6 },
    { x: 5, y: 2, z: 15, w: 4, h: 4, d: 4 },
    { x: -5, y: 1.5, z: -5, w: 3, h: 3, d: 3 }
];

obstacles.forEach(obs => {
    const obstacleGeometry = new THREE.BoxGeometry(obs.w, obs.h, obs.d);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(obs.x, obs.y, obs.z);
    scene.add(obstacle);
});


// Movement variables
const moveSpeed = 0.1;
const rotationSpeed = 0.002; // Slower for smoother mouse control
const bulletSpeed = 0.5;
const bullets = []; // Array to store active bullets

const keyboard = {};
document.addEventListener('keydown', (event) => {
    keyboard[event.code] = true;
});
document.addEventListener('keyup', (event) => {
    keyboard[event.code] = false;
});

// Toggle scoreboard on Tab key
document.addEventListener('keydown', (event) => {
    if (event.code === 'Tab') {
        event.preventDefault(); // Prevent browser default behavior (e.g., focus change)
        scoreboard.style.display = scoreboard.style.display === 'block' ? 'none' : 'block';
    } else if (event.code === 'Digit1' || event.code === 'Digit2' || event.code === 'Digit3') {
        const newIndex = parseInt(event.key) - 1;
        if (newIndex >= 0 && newIndex < weapons.length) {
            currentWeaponIndex = newIndex;
            currentWeapon = weapons[currentWeaponIndex];
            updateWeaponDisplay();
        }
    }
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

// Shooting mechanism
document.addEventListener('click', () => {
    if (controlsEnabled) { // Only shoot if controls are enabled (pointer locked)
        const currentTime = performance.now();
        if (currentTime - lastShotTime < currentWeapon.fireRate) {
            return; // Too fast, rate limit
        }
        lastShotTime = currentTime;

        // Calculate bullet direction from camera
        const bulletDirection = new THREE.Vector3();
        camera.getWorldDirection(bulletDirection);

        const bulletPosition = new THREE.Vector3();
        player.getWorldPosition(bulletPosition);
        bulletPosition.y += playerHeight / 2 + 0.1; // Offset to roughly eye level

        // Create bullet mesh for local display
        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: currentWeapon.bulletColor });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(bulletPosition);
        scene.add(bullet);

        bullets.push({ mesh: bullet, direction: bulletDirection });

        // Emit shoot event to server
        socket.emit('shoot', {
            position: bulletPosition,
            direction: bulletDirection,
            damage: currentWeapon.damage, // Send damage to server
            bulletColor: currentWeapon.bulletColor // Send bullet color for remote display
        });
    }
});

// Multiplayer logic
const otherPlayers = {}; // Map to store other players' meshes (socket.id -> mesh)
const remoteBullets = {}; // Map to store remote bullets { shooterId: [{mesh, direction}] }

function createPlayerMesh(color = 0xff0000) { // Default color for other players
    const playerGeo = new THREE.CapsuleGeometry(0.3, playerHeight / 2 - 0.3 * 2, 4);
    const playerMat = new THREE.MeshStandardMaterial({ color: color });
    const playerMesh = new THREE.Mesh(playerGeo, playerMat);
    return playerMesh;
}

socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach((id) => {
        if (id === socket.id) {
            // This is our player, update its position if it's the first time
            player.position.copy(players[id].position);
            player.rotation.y = players[id].rotation.y;
            camera.rotation.x = players[id].rotation.x;
            playerHealth = players[id].health; // Initialize our health
            updateHealthDisplay();
        } else {
            // Other players
            const otherPlayer = createPlayerMesh();
            otherPlayer.position.copy(players[id].position);
            otherPlayer.rotation.y = players[id].rotation.y;
            scene.add(otherPlayer);
            otherPlayers[id] = otherPlayer;
        }
        // Initialize scoreboard for all players
        playersScores[id] = { kills: players[id].kills, deaths: players[id].deaths };
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
        // For other players, we only update their body rotation (yaw).
        // Their camera pitch (rotation.x) is not directly applied to their body mesh.
        // If we want to show where they are looking, we'd need a separate mesh for their head/camera.
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
        // We will receive playerRespawned event
        playerHealth = 0; // Show 0 health for immediate feedback
        updateHealthDisplay();
        // Potentially add a "You Died" message or screen effect here
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
        controlsEnabled = true; // Assuming controls are disabled on death
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


socket.on('bulletShot', (bulletData) => {
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

// Animation loop
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
            moveDirection.applyQuaternion(player.quaternion);
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
            if (bullet.mesh.position.distanceTo(player.position) > 100) {
                scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                remoteBullets[shooterId].splice(i, 1);
            }
        }
    }

    renderer.render(scene, camera);
}
animate();