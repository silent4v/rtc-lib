import { print, defineGroup } from "./log.js";
import { EventCallback, EventTypes, OnEventType } from "./types.js";

defineGroup("Event", "red");
const log = (title: string, body: any) => {
  print("Event", title, body);
}

export class EventScheduler implements OnEventType {
  private prefix_ = "_ev_";
  private events_ = new Map<string, EventCallback<any>[]>();
  private volatileEvents_ = new Map<string, EventCallback<any>[]>();

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
  public dispatch(eventType: string, payload: any, ...args: any[]) {
    const eventName = this.prefix_ + eventType;
    const persistentEvents = this.events_.get(eventName) ?? [];
    const onceEvents = this.volatileEvents_.get(eventName) ?? [];
    const invokeChain = [...persistentEvents, ...onceEvents];
    log("Event::dispatch", { eventType, invokeChain });
    invokeChain.forEach(callback => callback(payload, ...args));
    this.volatileEvents_.delete(eventName);
  }

  /**
   * @description
   * It invoke addEventListener of sockRef, And modify the event pool.
   * Using `on()` will permanently monitor the triggering of the event until it is removed with `off()`
   */
  public on<T = any>(eventType: EventTypes, callback: EventCallback<T>) {
    const eventName = this.prefix_ + eventType;
    if (typeof callback !== "function") throw new TypeError("callback must be function");
    if (!this.events_.has(eventName)) this.events_.set(eventName, []);
    const pool = this.events_.get(eventName);
    pool!.push(callback);
    log("Event::on", { eventType, dispather: pool });
    return this;
  }

  /**
   * @description
   * It invoke addEventListener of sockRef, And modify the event pool.
   * Using `once()` when the first event is triggered, the listener will be removed
   * or invoke `offOnce()` to remove event listener
   */
  public once<T = any>(eventType: string, callback: EventCallback<T>) {
    const eventName = this.prefix_ + eventType;
    if (typeof callback !== "function") throw new TypeError("callback must be function");
    if (!this.volatileEvents_.has(eventName)) this.volatileEvents_.set(eventName, []);
    const pool = this.volatileEvents_.get(eventName);
    pool!.push(callback);
    log("Event::once", { eventType, dispather: pool });
    return this;
  }

  /**
   * @description
   * Remove every listened `eventType` handle
   * 
   * @example
   * rtc.on("test" as any, () => console.log("test event!"));
   * rtc.off("test"); // remove test event
   * rtc.dispatch("test", null) // nothing
   */
  public off(eventType: string, callback: EventCallback<any>, clearOnce = false) {
    const eventName = this.prefix_ + eventType;
    const persistentEvents = this.events_.get(eventName) ?? [];
    if (persistentEvents.includes(callback)) {
      const index = persistentEvents.indexOf(callback);
      persistentEvents.splice(index, 1);
    }

    if (clearOnce) {
      const volatile = this.volatileEvents_.get(eventName) ?? [];
      if (volatile.includes(callback)) {
        const index = volatile.indexOf(callback);
        volatile.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * remove all current listener on event `eventType`
   */
  public clear(eventType: string, clearOnce = false) {
    const eventName = this.prefix_ + eventType;
    this.events_.delete(eventName);
    if (clearOnce)
      this.volatileEvents_.delete(eventName);
    return this;
  }

  /**
   * @description
   * return a set of current listening event name.
   */
  public eventNames() {
    return [...this.events_.keys(), ...this.volatileEvents_.keys()].filter((e, i, a) => a.indexOf(e) === i);
  }
}
