import { randomTag } from "./utils.js";
import { BrowserListener, DataTuple, SocketEvent } from "./types";
import { RemoteManager } from "./rtc-connections.js";
import { failed } from "./log.js";
const { parse, stringify } = JSON;

/**
 *  Event-Driven Socket
 */
export class SocketAdapter {
  public sockRef: WebSocket;
  public lock = true;
  public readonly sessionId = randomTag();
  public username = null;
  public eventPool = new Map<SocketEvent, BrowserListener<any>[]>();

  constructor(sockOrigin: string, subProtocols?: string | string[]) {
    this.sockRef = new WebSocket(sockOrigin, subProtocols);
    this.initialize();
  }

  private initialize() {
    /* Proxy event to dispatcher */
    this.sockRef.onmessage = ({ data }) => {
      try {
        const [eventType, payload, ...flags] = parse(data);
        if (eventType && typeof eventType === "string") {
          const e = new CustomEvent(eventType, { detail: [payload, ...flags] });
          this.sockRef.dispatchEvent(e);
          return;
        }
        failed("[Websocket]", "Response format isn't DataTuple.");
      } catch (e) {
        failed("[Websocket]", "Response parse error.");
      }
    }

    this.sockRef.onclose = () => {
      const retryTime = 3;
      const retryInterval = 3000;
      const { url, protocol } = this.sockRef;
      this.lock = true;


      let attemptCount = retryTime;
      const timer = setInterval(async () => {
        const websocket = new WebSocket(url, protocol);
        this.reconnect(websocket);
        if (await this.isOpen() || (--attemptCount <= 0)) {
          clearInterval(timer);
        }
      }, retryInterval);
    }
  }

  public reconnect(sock: WebSocket) {
    this.sockRef = sock;
  }

  public isOpen() {
    return new Promise((resolve, _) => {
      this.once("open", () => resolve(true));
      this.once("close", () => resolve(false));

      if (this.sockRef.readyState === WebSocket.OPEN) resolve(true);
      if (this.sockRef.readyState === WebSocket.CLOSED) resolve(false);

    })

  }

  public close() {
    this.sockRef.onmessage = null;
    this.sockRef.onclose = null;
    this.sockRef.onopen = null;
    this.sockRef.close();
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

  /**
   * 
   * @param eventType
   * @param payload 
   * @param flags 
   * @returns 
   */
  public request<T = any>(eventType: string, payload: any, ...flags: any[]) {
    const replyToken = randomTag();
    const reqEvent = `request::${eventType}`;
    const packet = stringify([reqEvent, payload, replyToken, ...flags]);
    this.sockRef.send(packet);

    /* seal the return value */
    return new Promise<DataTuple<T>>((resolve, timeout) => {
      this.once(replyToken, ({ detail }) => {
        const [res] = detail;
        resolve(res);
      });

      setTimeout(() => timeout(`${eventType} response timeout`), 3000);
    });
  }

  /**
   * Dispatch event to sock, this is a very useful method when you want to customize the timing of certain events,
   * payload will pass to `data.detail`, you can use `({ detail }) => { dosomething() }` in the callback function.
   * 
   * @example
   * rtc.on("my-event", ({ detail }) => console.log(detail));
   * 
   * rtc.dispatch("my-event", {message: "test-string"})
   * //output {message: "test-string"}
   * 
   * rtc.dispatch("my-event", 1000-5)
   * //output 995
   */
  public dispatch(eventType: string, payload: any) {
    this.sockRef.dispatchEvent(new CustomEvent(eventType, { detail: payload }));
  }
}
