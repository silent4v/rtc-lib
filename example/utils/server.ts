import type { WebSocketServer } from "ws";
import type { Client } from "./client";
const { stringify } = JSON;

export interface ServerExtension {
  broadcast: (eventType: string, payload: any) => void;
  users: Map<string, Client>;
}

export type Server = WebSocketServer & ServerExtension;

export function serverInit(server: WebSocketServer) {
  Object.defineProperties(server, {
    broadcast: {
      value: (eventType: string, payload: any) =>
        server.clients.forEach(sock => {
          sock.emit(stringify({ eventType, payload }));
        })
    },
    users: {
      value: new Map<string, Client>()
    }
  })

  return server as Server;
}