const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname));

const players = {}; // Store player data: key = socket.id, value = { position, rotation, health, kills, deaths }
const bulletSpeed = 0.5; // Must match client's bullet speed for collision estimation
const playerHitboxRadius = 0.5; // Approximate player radius for collision
const respawnDelay = 3000; // 3 seconds

const spawnPoints = [
    { x: 0, y: 0.9, z: 0 },
    { x: 10, y: 0.9, z: 10 },
    { x: -10, y: 0.9, z: -10 },
    { x: 10, y: 0.9, z: -10 },
    { x: -10, y: 0.9, z: 10 }
];

const obstacles = [
    { x: 10, y: 2.5, z: -10, w: 5, h: 5, d: 5 },
    { x: -15, y: 3, z: 5, w: 6, h: 6, d: 6 },
    { x: 5, y: 2, z: 15, w: 4, h: 4, d: 4 },
    { x: -5, y: 1.5, z: -5, w: 3, h: 3, d: 3 }
];

function getRandomSpawnPoint() {
    return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Add new player to the players object
    const initialSpawn = getRandomSpawnPoint();
    players[socket.id] = {
        position: initialSpawn,
        rotation: { x: 0, y: 0 },
        health: 100, // Initial health
        kills: 0,
        deaths: 0
    };

    // Send the new player their initial state and current state of all other players
    socket.emit('currentPlayers', players);
    // Broadcast to other players that a new player has joined
    socket.broadcast.emit('newPlayer', {
        id: socket.id,
        position: players[socket.id].position,
        rotation: players[socket.id].rotation,
        health: players[socket.id].health,
        kills: players[socket.id].kills,
        deaths: players[socket.id].deaths
    });
    // Also, tell everyone about scores
    io.emit('playerScoreUpdated', players[socket.id]);

    socket.on('playerMove', (playerData) => {
        // Update player's data
        if (players[socket.id] && players[socket.id].health > 0) { // Only allow movement if alive
            players[socket.id].position = playerData.position;
            players[socket.id].rotation = playerData.rotation;

            // Broadcast the updated player data to all other players
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                position: players[socket.id].position,
                rotation: players[socket.id].rotation
            });
        }
    });

    socket.on('shoot', (bulletData) => {
        const shooterId = socket.id;
        const bulletPosition = bulletData.position;
        const bulletDirection = bulletData.direction;

        // Don't allow shooting if player is dead
        if (!players[shooterId] || players[shooterId].health <= 0) {
            return;
        }

        // Broadcast the bullet data to all other players for rendering
        socket.broadcast.emit('bulletShot', {
            shooterId: shooterId,
            position: bulletPosition,
            direction: bulletDirection
        });

        // Server-side collision detection
        // For simplicity, simulate bullet path and check for player collision
        const bulletCurrentPos = { x: bulletPosition.x, y: bulletPosition.y, z: bulletPosition.z };
        const simulatedSteps = 200; // Increase steps for more accuracy
        const stepSize = bulletSpeed * 0.5; // smaller step size

        for (let s = 0; s < simulatedSteps; s++) {
            bulletCurrentPos.x += bulletDirection.x * stepSize;
            bulletCurrentPos.y += bulletDirection.y * stepSize;
            bulletCurrentPos.z += bulletDirection.z * stepSize;

            // Obstacle collision
            for (const obs of obstacles) {
                if (bulletCurrentPos.x >= obs.x - obs.w / 2 && bulletCurrentPos.x <= obs.x + obs.w / 2 &&
                    bulletCurrentPos.y >= obs.y - obs.h / 2 && bulletCurrentPos.y <= obs.y + obs.h / 2 &&
                    bulletCurrentPos.z >= obs.z - obs.d / 2 && bulletCurrentPos.z <= obs.z + obs.d / 2) {
                    // Bullet hit an obstacle, stop simulation
                    return;
                }
            }

            for (const playerId in players) {
                if (playerId === shooterId || players[playerId].health <= 0) continue; // Don't hit self or dead players

                const targetPlayer = players[playerId];
                const distance = Math.sqrt(
                    Math.pow(bulletCurrentPos.x - targetPlayer.position.x, 2) +
                    Math.pow(bulletCurrentPos.y - targetPlayer.position.y - 0.9, 2) + // Adjust for player center
                    Math.pow(bulletCurrentPos.z - targetPlayer.position.z, 2)
                );

                if (distance < playerHitboxRadius) {
                    // Collision detected
                    console.log(`Player ${shooterId} hit player ${playerId}!`);
                    targetPlayer.health -= bulletData.damage; // Apply damage from bulletData

                    io.to(playerId).emit('playerHit', { health: targetPlayer.health }); // Tell hit player their new health

                    if (targetPlayer.health <= 0) {
                        targetPlayer.health = 0; // Ensure health doesn't go negative
                        console.log(`Player ${playerId} died!`);

                        // Increment kills for shooter, deaths for target
                        if (players[shooterId]) {
                            players[shooterId].kills++;
                            io.emit('playerScoreUpdated', {id: shooterId, ...players[shooterId]}); // Broadcast killer's new score
                        }
                        targetPlayer.deaths++;
                        io.emit('playerScoreUpdated', {id: playerId, ...targetPlayer}); // Broadcast dead player's new score

                        io.emit('playerDied', { playerId: playerId, killerId: shooterId }); // Inform all clients a player died

                        // Implement respawn logic
                        setTimeout(() => {
                            const respawnPoint = getRandomSpawnPoint();
                            targetPlayer.position = respawnPoint;
                            targetPlayer.health = 100;
                            io.emit('playerRespawned', {
                                playerId: playerId,
                                position: targetPlayer.position,
                                health: targetPlayer.health
                            });
                        }, respawnDelay);
                    }
                    return; // Bullet hit a player, stop simulating this bullet
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        // Remove player from our players object
        if (players[socket.id]) {
            const disconnectedPlayerId = socket.id;
            delete players[socket.id];
            // Broadcast to all other players that this player has disconnected
            io.emit('playerDisconnected', disconnectedPlayerId);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
