export type DataTuple<T = any, U extends any[] = any[]> = [T, ...U];

export type EventCallback<T> = (data: T, ...args: any[]) => void;

export interface OnEventType {
  /* Connect Event */
  on(eventType: "open", callback: EventCallback<Event>): this;
  on(eventType: "error", callback: EventCallback<Event>): this;
  on(eventType: "message", callback: EventCallback<Event>): this;
  on(eventType: "close", callback: EventCallback<Event>): this;
  on(eventType: "reconnect", callback: EventCallback<null>): this;

  /* Messenger Event */
  on(eventType: "text::highPressure", callback: EventCallback<number>): this;
  on(eventType: "text::remove", callback: EventCallback<Message>): this;
  on(eventType: "text::message", callback: EventCallback<Message>): this;

  /* Streamings Event */
  on(eventType: "text::message", callback: EventCallback<Message>): this;
  on(eventType: "text::message", callback: EventCallback<Message>): this;
}

export type EventTypes =
  | "open"
  | "message"
  | "close"
  | "error"
  | "reconnect"
  | "text::message"
  | "text::highPressure"
  | "text::remove"
  | "rtc::request"
  | "rtc::ice_switch"
  ;

/* Text chat */
export type Message = {
  roomId: string;
  message: string;
  who: string;
  at: number;
};


/* rtc */
export type RTCGuard = (e :{sdp: string, etag: string}) => void;

export type ConnectRequest = { sdp: RTCSessionDescription, etag: string };

export type ConnectContext = { pc: RTCPeerConnection, audio: HTMLAudioElement };

export type IceSwitchInfo = { candidate: RTCIceCandidateInit, etag: string };