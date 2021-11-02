import { EventCallback } from "./types";

export class EventScheduler {
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
    const persistentEvents = this.events_.get(eventType) ?? [];
    const onceEvents = this.volatileEvents_.get(eventType) ?? [];
    [...persistentEvents, ...onceEvents].forEach(callback => callback(payload, ...args));
    this.volatileEvents_.delete(eventType);
  }

  /**
   * @description
   * It invoke addEventListener of sockRef, And modify the event pool.
   * Using `on()` will permanently monitor the triggering of the event until it is removed with `off()`
   */
  public on<T = any>(eventType: string, callback: EventCallback<T>) {
    if (typeof callback !== "function") throw new TypeError("callback must be function");
    const pool = this.events_.get(this.prefix_ + eventType) ?? [];
    pool.push(callback);
    return this;
  }

  /**
   * @description
   * It invoke addEventListener of sockRef, And modify the event pool.
   * Using `once()` when the first event is triggered, the listener will be removed
   * or invoke `offOnce()` to remove event listener
   */
  public once<T = any>(eventType: string, callback: EventCallback<T>) {
    if (typeof callback !== "function") throw new TypeError("callback must be function");
    const pool = this.volatileEvents_.get(this.prefix_ + eventType) ?? [];
    pool.push(callback);
    return this;
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
  public off(eventType: string, callback: EventCallback<any>, clearOnce = false) {
    const persistentEvents = this.events_.get(eventType) ?? [];
    if (persistentEvents.includes(callback)) {
      const index = persistentEvents.findIndex(callback);
      persistentEvents.splice(index, 1);
    }

    if (clearOnce) {
      const volatile = this.volatileEvents_.get(eventType) ?? [];
      if (volatile.includes(callback)) {
        const index = volatile.findIndex(callback);
        volatile.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * remove all current listener on event `eventType`
   */
  public clear(eventType: string, clearOnce = false) {
    this.events_.delete(eventType);
    if (clearOnce)
      this.volatileEvents_.delete(eventType);
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