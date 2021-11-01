import { WebSocket, WebSocketServer } from "ws";

export interface Result {
  err: any;
  value: [string, any, ...any[]];
}

export interface IClientTrait {
  readonly sock_ref_: WebSocket;
  readonly server_ref_: WebSocketServer;
  username: string | null;
  etag: string | null;
  currentRoom: string | null;
  reply(event: string, payload: any, ...flags: any[]);
}

export type WsClient = IClientTrait & WebSocket;
