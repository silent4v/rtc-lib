import { delay, randomTag, waiting } from "./utils.js";
import type { DataTuple } from "./types.js";
import { info, failed, success, warning, debug as setDebug } from "./log.js";
import { EventScheduler } from "./events.js";
const { parse, stringify } = JSON;

export class Connector {
  public sockRef: WebSocket;
  public lock = true;
  public username = null;
  public readonly events = new EventScheduler;
  public readonly sessionId = randomTag();

  /* delegate function */
  public debug = (mode: boolean) => setDebug(mode);
  public dispatch = this.events.dispatch.bind(this.events);
  public on = this.events.on.bind(this.events);
  public once = this.events.once.bind(this.events);
  public off = this.events.off.bind(this.events);

  constructor(sockOrigin: string, subProtocols?: string | string[]) {
    this.sockRef = new WebSocket(sockOrigin, /* subProtocols */);
    this.initialize();
  }

  private initialize() {
    /* Proxy event to dispatcher. */
    this.sockRef.onopen = (e) => { 
      this.dispatch("open", e);
    };
    this.sockRef.onerror = (e) => this.dispatch("error", e);
    this.sockRef.onmessage = ({ data }) => {
      info("WebSocket", {
        message: "onmessage() invoke, dispatch events",
        rawData: data
      });

      try {
        const [eventType, payload, ...flags] = parse(data);
        if (eventType && typeof eventType === "string") {
          this.dispatch(eventType, [payload, ...flags]);
          return;
        }
        failed("WebSocket", "Response format isn't DataTuple.");
      } catch (e) {
        failed("WebSocket", "JSON parse error.");
      }
    }

    /* Try to reconnect to server. */
    this.sockRef.onclose = () => {
      info("WebSocket", "onclose() invoke")
      const { url, protocol } = this.sockRef;
      this.reconnect(new WebSocket(url, /* protocol */));
    }
  }

  private async reconnect(sock: WebSocket) {
    let retryTime = 3;
    let retryInterval = 1000;
    while (--retryTime > 0) {
      if (await waiting(sock)) {
        /* Success connect to websocket server */
        this.sockRef = sock;
        this.initialize();
        this.dispatch("reconnect", null);
        break;
      }
      await delay(retryInterval);
      warning("WebSocket", `Reconnect: ${retryTime} time`);
    }
  }

  /**
   * @description
   * It will safely close the sock connection without invoke a reconnection
   */
  public close() {
    this.sockRef.onopen = null;
    this.sockRef.onmessage = null;
    this.sockRef.onerror = null;
    this.sockRef.onclose = null;
    this.events.eventNames().forEach(evt => this.events.clear(evt, true));
    this.sockRef.close();
    success("WebSocket", "connection close safely.");
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
    info("[WebScoket]", `packed data: ${packet}`);
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
    const defaultTimeoutMilliSec = 3000;
    const replyToken = randomTag();
    const reqEvent = `request::${eventType}`;
    const packet = stringify([reqEvent, payload, replyToken, ...flags]);
    this.sockRef.send(packet);

    /* packed the return value */
    return new Promise<DataTuple<T>>((resolve, timeout) => {
      this.once(replyToken, (...data) => {
        resolve(data);
        info("WebSocket", {
          message: "recv response", eventType, payload, flags
        });
      });

      setTimeout(() => {
        timeout(`${eventType} response timeout`);
        failed("WebSocket", `default timeout is ${defaultTimeoutMilliSec} ms`)
      }, defaultTimeoutMilliSec);
    });
  }
}