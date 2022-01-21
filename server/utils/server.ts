import type { WebSocketServer } from "ws";
import type { Client } from "./client";
const { stringify } = JSON;

export class Server {
  static users_ = new Map<string, Client>();
  public users = Server.users_;
  /* function delegate to rawSockServer */
  public on = this.sock.on.bind(this.sock);
  public off = this.sock.off.bind(this.sock);
  public once = this.sock.once.bind(this.sock);
  public emit = this.sock.emit.bind(this.sock);
  public handleUpgrade = this.sock.handleUpgrade.bind(this.sock);

  constructor(public sock: WebSocketServer) { }

  public broadcast(eventType: string, payload: any) {
    this.users.forEach(sock => {
      sock.sendout(eventType, payload);
    })
  }
}