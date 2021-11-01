export type DataStack<T = any> = [T, ...any];

export interface CustomEventListener<T = any> {
  (evt: CustomEvent<DataStack<T>>): void;
}

export interface CustomEventListenerObj<T = any> {
  handleEvent(object: CustomEvent<DataStack<T>>): void;
}

export type BrowserListener<T = any> =
  | CustomEventListener<T>
  | CustomEventListenerObj<T>;

export type SocketEvent = string;
