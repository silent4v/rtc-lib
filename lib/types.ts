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
  on(eventType: "rtc::request", callback: EventCallback<ConnectRequest>): this;
  on(eventType: "rtc::exchange", callback: EventCallback<IceSwitchInfo>): this;
  on(eventType: "rtc::recvReq", callback: EventCallback<RTCChangeData>): this;
  on(eventType: "rtc::recvRes", callback: EventCallback<RTCChangeData>): this;
  on(eventType: "rtc::disconnected", callback: EventCallback<string>): this;
  on(eventType: "rtc::connected", callback: EventCallback<string>): this;
  on(eventType: "rtc::channel", callback: EventCallback<ChannelMessage>): this;
  on(eventType: "rtc::message", callback: EventCallback<ChannelMessage>): this;
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
  | "rtc::exchange"
  | "rtc::recvReq"
  | "rtc::recvRes"
  | "rtc::disconnected"
  | "rtc::connected"
  | "rtc::channel"
  | "rtc::message"
  ;

/* Text chat */
export type Message = {
  roomId: string;
  message: string;
  who: string;
  at: number;
};

/* rtc */
export type RTCChangeData = { RTCPeer: RTCPeerConnection, sessionId: string };

export interface RTCGuard { 
  (e: { sdp: string, sessionId: string }): void 
};


/**
 * @typedef RTCState
 * @prop {RTCPeerConnection} RTCnativeRef
 * @prop {string} connectionState
 * @prop {string} sessionId
 * @prop {HTMLAudioElement} source
 * @prop {boolean} muted
 */
export type RTCState = {
  RTCnativeRef: RTCPeerConnection;
  connectionState: string;
  sessionId: string;
  source: HTMLAudioElement;
  muted: boolean;
};

export type ConnectRequest = { 
  sdp: RTCSessionDescription, 
  sessionId: string,
  _replyToken?: string,
};

export type ConnectContext = {
  RTCRef: RTCPeerConnection,
  sessionId: string,
  media: MediaStream,
  audio: HTMLAudioElement,
  channel: RTCDataChannel
};

export type IceSwitchInfo = { candidate: RTCIceCandidateInit, sessionId: string };

export type ChannelMessage = { remoteSessionId: string, username: string, data: string }

export {};