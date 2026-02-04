import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

// server.js - Cloudflare Worker implementation

export default {
  async fetch(request, env, ctx) {
    console.log("Serving test response");
    return new Response("Hello, world!", {
      headers: { 'content-type': 'text/plain' },
    });
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
