import { WebSocket, WebSocketServer } from "ws";
import { Result, IClientTrait } from "./interface/client.trait.js";
import parse from "fast-json-parse";

/* apply class U member & function to instance T, but not modify prototype of T */
type Constructor<U> = new (...args: any[]) => U;
function applyTrait<T extends Object, U>(
  base: T,
  Trait: Constructor<U>,
  ...args: any[]
) {
  const { constructor, ...methods } = Object.getOwnPropertyDescriptors(
    Trait.prototype
  );
  const mixinObject = Object.assign(base, new Trait(...args));
  Object.defineProperties(mixinObject, methods);
  return mixinObject;
}

export class ClientTrait implements IClientTrait {
  public username = null;
  public sessionId = null;
  public currentRoom = null;
  public registered = false;

  constructor(
    public readonly server_ref_: WebSocketServer,
    public readonly sock_ref_: WebSocket
  ) {
    sock_ref_.on("message", function eventProxy(buf) {
      const rawData = buf.toString("utf-8");
      const result = parse(rawData) as Result;
      if (!result.err) {
        const [event, payload, ...flags] = result.value;
        if (event && typeof event === "string")
          sock_ref_.emit(event, [payload, ...flags]);
      }
    });
  }

  static init(server: WebSocketServer, sock: WebSocket) {
    return applyTrait(sock, ClientTrait, server, sock);
  }

  public reply(event: string, payload: any, ...flags: any[]) {
    this.sock_ref_.send(JSON.stringify([event, payload, ...flags]));
  }
}
