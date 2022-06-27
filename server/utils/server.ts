import type { WebSocketServer } from "ws";
import type { Client } from "./client";

export class Server {
  static users_ = new Map<string, Client>();
  static banWords_ = new Set<string>();
  static instance_: Server | undefined;
  static broadcast_ = (eventType: string, payload: any) => {
    Server.users_.forEach(sock => {
      sock.sendout(eventType, payload);
    });
  }

  public users = Server.users_;
  public banWords = Server.banWords_;
  
  /* function delegate to rawSockServer */
  public on = this.sock.on.bind(this.sock);
  public off = this.sock.off.bind(this.sock);
  public once = this.sock.once.bind(this.sock);
  public emit = this.sock.emit.bind(this.sock);
  public handleUpgrade = this.sock.handleUpgrade.bind(this.sock);

  private constructor(public sock: WebSocketServer) { }

  public static from(sock: WebSocketServer) {
    if(!Server.instance_) {
      Server.instance_= new Server(sock);
    }
    const banWordList = process.env.BAN_WORDS ?? "";
    Server.banWords_ = new Set(banWordList.split(","));
    return Server.instance_;
  }

  public broadcast(eventType: string, payload: any) {
    Server.broadcast_(eventType, payload);
  }
}