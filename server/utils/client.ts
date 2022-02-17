import { WebSocket } from "ws";
import { createHash } from "crypto";
import { performance } from "perf_hooks";
import parse from "fast-json-parse";
import { roomRef, channelRef } from "./index";
const dd = require("debug")("client");

export type Result = {
  err: any;
  value: {
    eventType: string;
    payload: any;
    _replyToken: string;
  }
}

export class Client {
  static appCount = 0;

  public username: string;
  public currentRoom: string;
  public sessionId: string;
  public sid: string;
  public subscribedChannel: Set<string>;
  public userData: any = {};
  public permission: any = {};

  /* function delegate to rawSock */
  public on = this.sock.on.bind(this.sock);
  public off = this.sock.off.bind(this.sock);
  public once = this.sock.once.bind(this.sock);
  public emit = this.sock.once.bind(this.sock);
  public eventPool = new Map<string, EventListener>();

  constructor(public sock: WebSocket) {
    Client.appCount = (Client.appCount + 1) % 0xfffff;
    const timestamp = Date.now();
    const chunk = `${timestamp}${performance.now()}${Client.appCount}`;
    const sessionId = createHash("sha224").update(chunk).digest("hex");

    this.username = "$NONE";
    this.currentRoom = "$NONE";
    this.sessionId = sessionId;
    this.sid = sessionId.slice(0, 8);
    this.subscribedChannel = new Set();
    this.initial();

    this.on("close", () => {
      this.subscribedChannel.forEach(ch => this.unsubscribe(ch));
      this.exit();
    });
  }

  /**
   * Allow Client Proxy `onmessage` event
   * 
   * @description
   * Client.initial() will listen `message` event, when receive message,
   * try parse to JSON, if data is JSON and match DataTuple-type, emit
   * DataTuple's `{ eventType, payload, _reply Token }`
   */
  public initial() {
    const sock = this.sock;
    sock.on("message", function eventProxy(buffer) {
      const rawData = buffer.toString("utf8");
      const result: Result = parse(rawData);
      if (result.err) {
        dd("message format is not JSON");
      } else {
        const { eventType, payload, _replyToken } = result.value;
        if (eventType && typeof eventType === "string") {
          sock.emit(eventType, payload, _replyToken);
          dd("%s %O %s", eventType, payload, _replyToken)
        }
      }
    });
  }

  /**
   * Leave the current room to "$NONE"
   */
  public exit() {
    roomRef.container.get(this.currentRoom)?.delete(this.sessionId);
    this.currentRoom = "$NONE";
    dd("from %s to $NONE", this.currentRoom);
  }

  /**
   * Leave the current room to specific room
   */
  public enter(rName: string) {
    roomRef.enter(this.sessionId, rName);
    this.currentRoom = rName;
    dd("%s from %s to %s", this.sid, this.currentRoom, rName);
  }

  /**
   * `channel` collection add self, `subscribedChannel` add `channel`
   * 
   * @description
   * Trace a channel, when another client talk to this channel,
   * server will broadcast to every client who subscribe this channel.
   * @param ch channel name
   */
  public subscribe(ch: string) {
    channelRef.subscribe(this.sessionId, ch);
    this.subscribedChannel.add(ch);
    dd("%s current subscribe: %O", this.sid, this.subscribedChannel);
  }

  /**
   * `channel` collection remove self, `subscribedChannel` remove `channel`
   */
  public unsubscribe(ch: string) {
    channelRef.unsubscribe(this.sessionId, ch);
    this.subscribedChannel.delete(ch);
    dd("%s current subscribe: %O", this.sid, this.subscribedChannel);
  }

  /**
   * keep only one channel
   * 
   * @param {string} ch unsubscribe from channels other than this one
   */
  public only(ch: string) {
    this.subscribedChannel.forEach(ch => {
      channelRef.unsubscribe(this.sessionId, ch)
    });
    this.subscribedChannel.clear();

    this.subscribe(ch);
  }

  /**
   * check Room#tokenMatchTable, if token in table
   * direct user to room specified by table,
   * then set userData , permission.
   * 
   * return whether the token was found in the match table
   */
  public useToken(token: string) {
    const data = roomRef.takeMatchData(token)
    if (data) {
      this.only(data.room);
      this.enter(data.room);
      this.userData = data.userData;
      this.permission = data.permission;
      if (this.permission.text === false) {
        const callback = this.eventPool.get("request::text::message");
        if (callback) {
          this.off("request::text::message", callback as EventListener);
        }
      }
    }
    dd("useToken: %o", data);
    return !!data;
  }

  /**
   * Package data in DataTuple format, then send it out to the network
   * @param {string} eventType Name of the event
   * 
   * @param {any} payload Data content, allowing `any` type
   * 
   */
  public sendout<T>(eventType: string, payload: T) {
    const data = JSON.stringify({ eventType, payload });
    this.sock.send(data);
    dd("[%s] %O", eventType, payload)
  }

}