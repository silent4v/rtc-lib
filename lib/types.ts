export type DataTuple<T = any, U extends any[] = any[]> = [T, ...U];

export interface CustomEventListener<T = any> {
  (evt: CustomEvent<DataTuple<T>>): void;
}

export interface CustomEventListenerObj<T = any> {
  handleEvent(object: CustomEvent<DataTuple<T>>): void;
}

export type EventCallback<T> = (data: T, ...args: any[]) => void;

export type BrowserListener<T = any> =
  | CustomEventListener<T>
  | CustomEventListenerObj<T>;

export type SocketEvent = string;

export type ConnectRequest = { sdp: RTCSessionDescription, etag: string };

export type ConnectContext = { pc: RTCPeerConnection, audio: HTMLAudioElement };

export type IceSwitchInfo = { candidate: RTCIceCandidateInit, etag: string };