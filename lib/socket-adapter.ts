import { randomTag } from "./random-tag.js";
import { BrowserListener, DataStack, SocketEvent } from "./declare";
import { RemoteManager } from "./remote-manager.js";
const { parse, stringify } = JSON;


export class SocketAdapter {
  public sockRef: WebSocket;
  public room = "";
  public lock = true;
  public etag = randomTag();
  public username = "_DEFAULT_USERNAME_";
  public eventPool = new Map<SocketEvent, BrowserListener<any>[]>();
  public remoteManager: RemoteManager;

  constructor(sockOrigin: string, subProtocols?: string | string[]) {
    this.sockRef = new WebSocket(sockOrigin, subProtocols);

    /* Agent events triggered by the server */
    this.sockRef.onmessage = ({ data }) => {
      const [eventType, payload, ...flags] = parse(data);
      if (eventType) {
        const event = new CustomEvent(eventType, {
          detail: [payload, ...flags],
        });
        this.sockRef.dispatchEvent(event);
      }
    };

    this.once("open", () => {
      console.log("connect established");
      this.lock = false;
    })

    this.remoteManager = new RemoteManager(this);
  }

  public isOpen() {
    return new Promise((resolve, reject) => {
      this.once("open", () => {
        if(this.sockRef.readyState === 1) {
          resolve(true);
        } else {
          reject(false);
        }
      });

      if(this.sockRef.readyState === 1) 
        resolve(true);
    })
    
  }

  public close() {
    this.sockRef.onmessage = null;
    this.sockRef.onclose = null;
    this.sockRef.onopen = null;
    this.sockRef.close();
  }

  public reconnect(sock: WebSocket) {
    this.sockRef = sock;

    /* Agent events triggered by the server */
    this.sockRef.onmessage = ({ data }) => {
      const [eventType, payload, ...flags] = parse(data);
      if (eventType) {
        const event = new CustomEvent(eventType, {
          detail: [payload, ...flags],
        });
        this.sockRef.dispatchEvent(event);
      }
    };

    /* Re-register event */
    for (const [type, callback] of this.eventPool.entries()) {
      if (type.includes("once::")) {
        callback.forEach((fn) => sock.addEventListener(type, fn as any));
      } else {
        const eventName = type.substr(6);
        callback.forEach((fn) =>
          sock.addEventListener(eventName, fn as any, { once: true })
        );
      }
    }
  }

  public connections() {
    return this.remoteManager.connections;
  }

  public on<T = any>(eventType: string, callback: BrowserListener<T>) {
    const pool = this.eventPool.get(eventType) ?? [];
    this.eventPool.set(eventType, [...pool, callback]);
    this.sockRef.addEventListener(eventType, callback as any);
  }

  public once<T = any>(eventType: string, callback: BrowserListener<T>) {
    const onceType = `once::${eventType}`;
    const pool = this.eventPool.get(onceType) ?? [];
    this.eventPool.set(onceType, [...pool, callback]);
    this.sockRef.addEventListener(
      eventType,
      (e) => {
        if (typeof callback === "function") callback(e as any);

        /* Remove event from event-pool */
        const poolRef = this.eventPool.get(onceType) ?? [];
        const event = poolRef.filter((evt) => evt !== callback);
        this.eventPool.set(onceType, event);
      },
      { once: true }
    );
  }

  public off(eventType: SocketEvent) {
    const pool = this.eventPool.get(eventType) ?? [];
    pool.forEach((cb) => this.sockRef.removeEventListener(eventType, cb as any));
  }

  public offOnce(eventType: SocketEvent) {
    const onceType = `once::${eventType}`;
    const pool = this.eventPool.get(onceType) ?? [];
    pool.forEach((cb) => this.sockRef.removeEventListener(onceType, cb as any));
  }

  public sendout(eventType: string, payload: any, ...flags: any[]) {
    const packet = stringify([eventType, payload, ...flags]);
    this.sockRef.send(packet);
  }

  public request<T = any>(eventType: string, payload: any, ...flags: any[]) {
    const replyToken = randomTag();
    const reqEvent = `request::${eventType}`;
    const packet = stringify([reqEvent, payload, replyToken, ...flags]);
    this.sockRef.send(packet);

    /* seal the return value */
    return new Promise<DataStack<T>>((resolve, timeout) => {
      this.once(replyToken, ({ detail }) => {
        const [res] = detail;
        resolve(res);
      });

      setTimeout(() => timeout(`${eventType} response timeout`), 3000);
    });
  }

  public dispatchEvent(eventType: string, payload: any) {
    this.sockRef.dispatchEvent(new CustomEvent(eventType, { detail: payload }));
  }
}
