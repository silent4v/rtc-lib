import { delay, waiting } from "./utils.js";
import { Messenger } from "./messenger.js";
import { info, failed, success, warning, debug } from "./log.js";
import { EventScheduler } from "./events.js";
import { Streamings } from "./streamings.js";
const { parse, stringify } = JSON;

/** 
 * @class
 */
export class Connector {
  public sockRef: WebSocket;

  /** @member {string} */
  public sessionId = "";

  /**
   * @member {string=}
   */
  public username = "@anonymous";

  private reqIter_ = this.gen();
  private incrSeq_ = "_DEFAULT_";
  private registerd_ = false;

  public trace = (pattern: string = "*") => debug(pattern);
  public untrace = (pattern: string) => debug(pattern, false);

  /**
   * @readonly
   * @member {EventScheduler}
   */
  public readonly events = new EventScheduler;
  public dispatch = this.events.dispatch.bind(this.events);
  public on = this.events.on.bind(this.events);
  public once = this.events.once.bind(this.events);
  public off = this.events.off.bind(this.events);

  /**
   * @readonly
   * @member {Messenger}
   */
  public readonly messenger = new Messenger(this);
  public talk = this.messenger.talk.bind(this.messenger);
  public reserve = this.messenger.reserve.bind(this.messenger);
  public truncate = this.messenger.truncate.bind(this.messenger);
  public read = this.messenger.read.bind(this.messenger);
  public only = this.messenger.only.bind(this.messenger);
  public subscribe = this.messenger.subscribe.bind(this.messenger);
  public unsubscribe = this.messenger.unsubscribe.bind(this.messenger);
  public notify = this.messenger.notify.bind(this.messenger);
  public cancelNotify = this.messenger.cancelNotify.bind(this.messenger);

  /**
   * @readonly
   * @member {Streamings}
   */
  public readonly streamings = new Streamings(this);
  public streamStates = () => this.streamings.state;
  public call = this.streamings.call.bind(this.streamings);
  public setDevice = this.streamings.setDevice.bind(this.streamings);
  public setDeviceEnabled = this.streamings.setDeviceEnabled.bind(this.streamings);
  public setRemoteMuted = this.streamings.setRemoteMuted.bind(this.streamings);
  public setGuard = this.streamings.setGuard.bind(this.streamings);

  /**
   * @constructor
   * @param  {string} sockOrigin - websocket server URL. Ex: **wss://{domain}/{path}**
   * @param  {string|string[]} [subProtocols] - custom define protocols, put in Header **Sec-WebSocket-Protocol**
   */
  constructor(sockOrigin: string, subProtocols?: string | string[]) {
    /**
     * @member {WebSocket}
     */
    this.sockRef = new WebSocket(sockOrigin, subProtocols);
    this.initialize();
    this.reqIter_.next();
  }

  /**
   * @private
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
        const { eventType, payload, _replyToken = "" } = parse(data);
        if (eventType && typeof eventType === "string") {
          this.dispatch(eventType, payload, _replyToken);
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
      const { url } = this.sockRef;
      this.reconnect(new WebSocket(url, /* protocol */));
    }
  }

  /**
   * 
   * @description
   * When websocket disconnect, it will try reconnect to sock server,
   * default will retry 3 time, eveny 1s retry.
   * if can't connect to socket server, throw Error.
   * 
   * @param {WebSocket} sock 
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
        if (this.registerd_) this.register(this.username);
        success("Connector::reconnect", "reconnect");
        break;
      }
      await delay(retryInterval);
      warning("WebSocket", `Reconnect: ${retryTime} time`);
    }

    if (await waiting(sock) === false)
      throw new Error("Websocket server can't establish connection.");
  }

  /**
   * @description
   * register self to websocket server
   */
  public register(username: string) {
    this.username = username;
    const result = this.request<{ sessionId: string }>("register", { username });
    return result.then(({ sessionId }) => { 
      this.registerd_ = true; 
      this.sessionId = sessionId;
      return sessionId;
    });
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
   * @async
   * @param {string} eventType
   * @param {any} payload
   * @param {...any} [flags]
   */
  public async sendout(eventType: string, payload: any, _replyToken: string = "") {
    await waiting(this.sockRef);
    let vaildPayload = payload ?? "$DEFAULT";
    const packetData = stringify({ eventType, payload: vaildPayload, _replyToken });
    this.sockRef.send(packetData);
    info("Connector::sendData", { eventType, payload: vaildPayload, _replyToken });
  }

  /**
   * @description
   * Emit DataTuple to server, this DataTuple use **request::** namespace event and include flags **replyToken**,
   * when server reply, dispatch event to **{eventType}::{replyToken}**, return **Promise.resolve(response_data)**
   * If the response timeout, then return **Promise.reject(`{event} timeout`)**;
   * @async
   * @param  {string} eventType
   * @param  {any} payload
   * @param  {...any} [flags]
   *
   * @example
   * rtc.request("room::list").then( list => console.log(list) );
   * 
   * @example
   * try {
   *  const roomList = await rtc.request("room::list")
   * } catch (err) {
   *  console.log(err) // room::list response timeout.
   * }
   *
   */
  public async request<T = any>(eventType: string, payload?: any) {
    const defaultTimeoutMilliSec = 3000;
    const reqEvent = `request::${eventType}`;
    this.reqIter_.next(`${eventType}`)
    this.sendout(reqEvent, payload, this.incrSeq_);

    /* packed the return value */
    return new Promise<T>((resolve, timeout) => {
      const timer = setTimeout(() => {
        timeout(`${eventType} response timeout`);
        failed("Connector::res-timeout", `default timeout is ${defaultTimeoutMilliSec} ms`)
      }, defaultTimeoutMilliSec);

      this.once(this.incrSeq_, (data) => {
        clearTimeout(timer);
        resolve(data);
        info("Connector::response", {
          response: eventType, data
        });
      });
    });
  }
}
