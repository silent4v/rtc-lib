import type { DataTuple } from "./types.js";
import { delay, randomTag, waiting } from "./utils.js";
import { Messenger } from "./messenger.js";
import { info, failed, success, warning, debug } from "./log.js";
import { EventScheduler } from "./events.js";
import { Streamings } from "./streamings.js";
const { parse, stringify } = JSON;

export class Connector {
  public sockRef: WebSocket;
  public lock = true;
  public username = null;
  private reqIter_ = this.gen();
  private incrSeq_ = "_DEFAULT_";
  private registerd_ = false;

  /* delegate function */
  public readonly events = new EventScheduler;
  public trace = (pattern: string = "*") => debug(pattern);
  public untrace = (pattern: string) => debug(pattern, false);
  public dispatch = this.events.dispatch.bind(this.events);
  public on = this.events.on.bind(this.events);
  public once = this.events.once.bind(this.events);
  public off = this.events.off.bind(this.events);

  public readonly messenger = new Messenger(this);
  public readonly streamings = new Streamings(this);
  public readonly sessionId = randomTag();
  

  constructor(sockOrigin: string, subProtocols?: string | string[]) {
    this.sockRef = new WebSocket(sockOrigin, /* subProtocols */);
    this.initialize();
    this.reqIter_.next();
    Object.defineProperty(this, "sessionId", {
      writable: false,
      configurable: false,
    });
  }

  /**
   * @description
   * Initialize the event name iterator, which will ensure that the request token will never be repeated.
   */
  private *gen() {
    let evt = "";
    while (true) {
      this.incrSeq_ = `${evt}::${performance.now().toString(36)}`;
      evt = yield;
    }
  }

  /**
   * @description
   * set default message & close function,
   * when message is coming, EventScheduler will dispatch to client listener,
   * when connection close(=disconnect), retry connect to server.
   */
  private initialize() {
    /* Proxy event to dispatcher. */
    this.sockRef.onopen = (e) => {
      this.dispatch("open", e);
    };
    this.sockRef.onerror = (e) => this.dispatch("error", e);
    this.sockRef.onmessage = ({ data }) => {
      warning("Connector::onmessage", {
        rawData: data
      });

      try {
        const [eventType, payload, ...flags] = parse(data);
        if (eventType && typeof eventType === "string") {
          this.dispatch(eventType, payload, ...flags);
          return;
        }
        failed("Connector::onmessage", "Response format isn't DataTuple.");
      } catch (e) {
        failed("Connector::onmessage", "JSON parse error.");
      }
    }

    /* Try to reconnect to server. */
    this.sockRef.onclose = e => {
      warning("Connector::close", "close");
      this.dispatch("close", e);
      const { url, protocol } = this.sockRef;
      this.reconnect(new WebSocket(url, /* protocol */));
    }
  }

  /**
   * @description
   * When websocket disconnect, it will try reconnect to sock server,
   * default will retry 3 time, eveny 1s retry.
   * if can't connect to socket server, throw Error.
   */
  private async reconnect(sock: WebSocket) {
    let retryTime = 3;
    let retryInterval = 1000;
    while (--retryTime > 0) {
      if (await waiting(sock)) {
        /* Success connect to websocket server */
        this.sockRef = sock;
        this.initialize();
        this.dispatch("reconnect", null);
        if (this.registerd_) this.register();
        success("Connector::reconnect", "reconnect");
        break;
      }
      await delay(retryInterval);
      warning("WebSocket", `Reconnect: ${retryTime} time`);
    }

    if(await waiting(sock) === false)
      throw new Error("Websocket server can't establish connection.");
  }

  /**
   * @description
   * register self to websocket server
   */
  public register() {
    const result = this.request<boolean>("register", { username: this.username, sessionId: this.sessionId });
    return result.then(e => { this.registerd_ = true });
  };


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
  public async sendout(eventType: string, payload: any, ...flags: any[]) {
    await waiting(this.sockRef);
    const packetData = stringify([eventType, payload, ...flags]);
    this.sockRef.send(packetData);
    info("Connector::sendData", [eventType, payload, ...flags]);
  }

  /**
   * @description
   * Emit DataTuple to server, this DataTuple use `request::` namespace event and include flags `replyToken`,
   * when server reply, dispatch event to event::replyToken, return Promise.resolve(server_response)
   * If the response timeout, then return Promise.reject(`{event} timeout`);
   * 
   * @examplef
   * rtc.request("room::list").then( list => console.log(list) );
   * 
   * //or if in async function:
   * try {
   *  const roomList = await rtc.request("room::list")
   * } catch (err) {
   *  console.log(err) // room::list response timeout.
   * }
   */
  public async request<T = any>(eventType: string, payload: any, ...flags: any[]) {
    const defaultTimeoutMilliSec = 3000;
    const reqEvent = `request::${eventType}`;
    this.reqIter_.next(`${eventType}`)
    this.sendout(reqEvent, payload, this.incrSeq_, flags);

    /* packed the return value */
    return new Promise<DataTuple<T>>((resolve, timeout) => {
      const timer = setTimeout(() => {
        timeout(`${eventType} response timeout`);
        failed("Connector::res-timeout", `default timeout is ${defaultTimeoutMilliSec} ms`)
      }, defaultTimeoutMilliSec);

      this.once(this.incrSeq_, (...data) => {
        clearTimeout(timer);
        resolve(data);
        info("Connector::response", {
          response: eventType, data
        });
      });
    });
  }
}