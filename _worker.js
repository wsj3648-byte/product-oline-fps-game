import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

// server.js - Cloudflare Worker implementation

const INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title>My first oline game</title>
		<link rel="icon" href="favicon.svg" type="image/svg+xml" />
		<link rel="apple-touch-icon" href="favicon.svg" /> <!-- Recommended for iOS devices -->
		<link rel="stylesheet" href="style.css">
	</head>
	<body>
		<canvas id="c"></canvas>
		<div id="crosshair"></div>
		<div id="healthDisplay">Health: 100</div>
		<div id="scoreboard">
			<h2>Scoreboard</h2>
			<table id="scoreboardTable">
				<thead>
					<tr>
						<th>Player ID</th>
						<th>Kills</th>
						<th>Deaths</th>
					</tr>
				</thead>
				<tbody>
					<!-- Player scores will be inserted here by JavaScript -->
				</tbody>
			</table>
		</div>

		<script src="https://unpkg.com/three@0.128.0/build/three.min.js"></script>
		<script src="https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
		<script src="https://unpkg.com/three@0.128.0/examples/js/geometries/CapsuleGeometry.js"></script>
		<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
		<script src="game.js"></script>
	</body>
</html>`;

export default {
  async fetch(request, env, ctx) { // Add ctx argument
    const url = new URL(request.url);

    // Explicitly serve index.html for root or /index.html path
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(INDEX_HTML_CONTENT, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      });
    }

    // Handle WebSocket upgrade requests
    if (url.pathname === "/websocket") {
      const roomId = "game_room_alpha"; // Fixed room name for now
      const id = env.GAME_ROOM.idFromName(roomId);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    // Serve static files
    try {
      const options = {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST ? JSON.parse(env.__STATIC_CONTENT_MANIFEST) : null,
      };
      const assetRequest = mapRequestToAsset(request);
      return await getAssetFromKV(
        {
          request: assetRequest,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        options
      );
    } catch (e) {
      // Fallback to a custom 404 page or simple 404
      const pathname = url.pathname;
      return new Response(`"${pathname}" not found`, {
        status: 404,
        statusText: "Not Found",
      });
    }
  },
};
// Durable Object class remains the same
export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = []; // Array of WebSocket sessions
    this.state.blockConcurrencyWhile(async () => {
      // Restore state if necessary
      // For now, just logging
      console.log("GameRoom Durable Object initialized");
    });
  }

  async fetch(request) {
    const url = new URL(request.url);

    // Handle WebSocket requests
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair());

      // Accept the WebSocket connection
      this.state.acceptWebSocket(server);

      // Add the session
      this.sessions.push({ websocket: server });
      console.log("New WebSocket session established. Total:", this.sessions.length);

      // Handle messages from the client
      server.addEventListener("message", async (event) => {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        // Simple broadcast for testing
        this.sessions.forEach(session => {
            try {
                session.websocket.send(JSON.stringify({ type: "echo", data: message }));
            } catch (e) {
                console.error("Error sending message:", e);
            }
        });
      });

      server.addEventListener("close", async (event) => {
        console.log("WebSocket closed", event.code, event.reason);
        this.sessions = this.sessions.filter(s => s.websocket !== server);
        console.log("WebSocket session closed. Total:", this.sessions.length);
      });

      server.addEventListener("error", async (event) => {
        console.error("WebSocket error:", event.error);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Expected WebSocket upgrade", { status: 400 });
  }
}