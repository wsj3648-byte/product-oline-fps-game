// server.js - Cloudflare Worker implementation

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle WebSocket upgrade requests
    if (url.pathname === "/websocket") {
      const roomId = "game_room_alpha"; // Fixed room name for now
      const id = env.GAME_ROOM.idFromName(roomId);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    // Serve static files (simplified - this is usually handled by Pages/etc.)
    // For now, if not a websocket request, return a simple response.
    // In a real scenario, this worker might proxy to Pages or serve assets itself.
    return new Response("Not Found", { status: 404 });
  },
};

// Durable Object class
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