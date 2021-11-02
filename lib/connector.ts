import { delay, randomTag, waiting } from "./utils.js";
import { BrowserListener, DataTuple, EventCallback, SocketEvent } from "./types";
import { failed } from "./log.js";
import { EventScheduler } from "./events.js";
const { parse, stringify } = JSON;

export class Connector {
  public sockRef: WebSocket;
  public lock = true;
  public username = null;
  public readonly events = new EventScheduler;
  public readonly sessionId = randomTag();

  constructor(sockOrigin: string, subProtocols?: string | string[]) {
    this.sockRef = new WebSocket(sockOrigin, subProtocols);
    this.initialize();
  }

  private initialize() {
    /* Proxy event to dispatcher. */
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

    /* Try to reconnect to server. */
    this.sockRef.onclose = () => {
      const { url, protocol } = this.sockRef;
      this.reconnect(new WebSocket(url, protocol));
    }
  }

  /**
   * @description
   * close will safely close the sock connection without invoke a reconnection
   */
  public close() {
    this.sockRef.onopen = null;
    this.sockRef.onmessage = null;
    this.sockRef.onerror = null;
    this.sockRef.onclose = null;
    this.sockRef.close();
  }

  public async reconnect(sock: WebSocket) {
    this.sockRef = sock;

    let retryTime = 3;
    let retryInterval = 1000;
    while (--retryTime > 0) {
      if (await waiting(sock)) {
        /* Success connect to websocket server */
        this.initialize();
        this.dispatch("reconnect", null);
        break;
      }
      await delay(retryInterval);
    }
  }

  /**
   * @description
   * whether websocket is connected
   */
  public get ready() {
    return this.sockRef.readyState === WebSocket.OPEN;
  }

  /**
   * @description
   * Emit DataTuple to server, simple packed data to DataTuple.
   */
   public sendout(eventType: string, payload: any, ...flags: any[]) {
    const packet = stringify([eventType, payload, ...flags]);
    this.sockRef.send(packet);
  }

  /**
   * @description
   * Emit DataTuple to server, this DataTuple use `request::` namespace event and include flags `replyToken`,
   * when server reply, dispatch event to event::replyToken, return Promise.resolve(server_response)
   * If the response timeout, then return Promise.reject(`{event} timeout`);
   * 
   * @example
   * rtc.request("room::list").then( list => console.log(list) );
   * 
   * //or if in async function:
   * try {
   *  const roomList = await rtc.request("room::list")
   * } catch (err) {
   *  console.log(err) // room::list response timeout.
   * }
   */
  public request<T = any>(eventType: string, payload: any, ...flags: any[]) {
    const replyToken = randomTag();
    const reqEvent = `request::${eventType}`;
    const packet = stringify([reqEvent, payload, replyToken, ...flags]);
    this.sockRef.send(packet);

    /* packed the return value */
    return new Promise<DataTuple<T>>((resolve, timeout) => {
      this.once(replyToken, ({ detail }) => {
        const [res] = detail;
        resolve(res);
      });

      setTimeout(() => {
        timeout(`${eventType} response timeout`);
      }, 3000);
    });
  }

  /**
   * @description
   * It invoke addEventListener of sockRef, And modify the event pool.
   * Using `on()` will permanently monitor the triggering of the event until it is removed with `off()`
   */
  public on<T = any>(eventType: string, callback: EventCallback<any>) {
    this.events.on(eventType, callback);
  }

  /**
   * @description
   * Remove every listened `eventType` handle
   * 
   * @example
   * rtc.on("test", () => console.log("test event!"));
   * rtc.off("test"); // remove test event
   * rtc.dispatch("test", null) // nothing
   */
  public off(eventType: string, callback: EventCallback<any>) {
    this.events.off(eventType, callback);
  }

  /**
   * @description
   * It invoke addEventListener of sockRef, And modify the event pool.
   * Using `once()` when the first event is triggered, the listener will be removed
   * or invoke `offOnce()` to remove event listener
   */
  public once<T = any>(eventType: string, callback: EventCallback<T>) {
    this.events.once(eventType, callback);
  }

  /**
   * @description
   * Dispatch event to sock, this is a very useful method when you want to customize the timing of certain events,
   * payload will pass to `data.detail`, you can use `({ detail }) => { dosomething() }` in the callback function.
   * 
   * @example
   * rtc.on("my-event", (data) => console.log(detail);
   * 
   * rtc.dispatch("my-event", {message: "test-string"})
   * //output {message: "test-string"}
   * 
   * rtc.dispatch("my-event", 1000-5)
   * //output 995
   */
  public dispatch(eventType: string, payload: any) {
    this.events.dispatch(eventType, payload);
  }
}

