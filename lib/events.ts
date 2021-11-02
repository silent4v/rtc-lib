import { EventCallback } from "./types";

export class EventScheduler {
  private prefix_ = "_ev_";
  private events_ = new Map<string, Function[]>();
  private volatileEvents_ = new Map<string, Function[]>();

  public dispatch(eventType: string, payload: any) {
    const persistentEvents = this.events_.get(eventType) ?? [];
    const onceEvents = this.volatileEvents_.get(eventType) ?? [];
    [...persistentEvents, ...onceEvents].forEach(callback => callback(payload));
    this.volatileEvents_.delete(eventType);
  }

  public on<T = any>(eventType: string, callback: EventCallback<T>) {
    if (typeof callback !== "function") throw new TypeError("callback must be function");
    const pool = this.events_.get(this.prefix_ + eventType) ?? [];
    pool.push(callback);
  }

  public once<T = any>(eventType: string, callback: EventCallback<T>) {
    if (typeof callback !== "function") throw new TypeError("callback must be function");
    const pool = this.volatileEvents_.get(this.prefix_ + eventType) ?? [];
    pool.push(callback);
  }

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
  }

  public clear(eventType: string, clearOnce = false) {
    this.events_.delete(eventType);
    if (clearOnce)
      this.volatileEvents_.delete(eventType);
  }
}