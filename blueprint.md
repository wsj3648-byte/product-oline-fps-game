# Online FPS Game

## Overview

This is a simple online first-person shooter (FPS) game built with Node.js, Express, Socket.IO, and Three.js.

## Features

*   **Multiplayer:** Players can join a game and see each other.
*   **Movement:** Players can move around the game world.
*   **Shooting:** Players can shoot and hit other players.
*   **Health and Score:** Players have health, and the game tracks kills and deaths.
*   **Weapons:** Players can switch between different weapons.

## Current State

The basic structure of the game is in place, but there are some missing pieces:

*   The client-side `animate` function in `game.js` is incomplete. Player movement, camera rotation, and rendering are not implemented yet.
*   The game world is a flat plane.
*   The visual style is very basic.

## Plan

1.  **Complete `game.js`**:
    *   Implement player movement based on keyboard input.
    *   Implement camera rotation based on mouse movement.
    *   Add the `renderer.render(scene, camera)` call to the `animate` function.
    *   Implement the logic to display remote bullets.
2.  **Refine the game**:
    *   Add obstacles to the environment.
    *   Improve the visual style of the game.
    *   Add a crosshair.
    *   Add sounds for shooting and hitting.
