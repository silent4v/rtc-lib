export type DataTuple<T = any, U extends any[] = any[]> = [T, ...U];

export type EventCallback<T> = (data: T, ...args: any[]) => void;

export type SocketEvent = string;

/* Text chat */
export type Message = {
  roomId: string;
  message: string;
  who: string;
  at: number;
};

export type ConnectRequest = { sdp: RTCSessionDescription, etag: string };

export type ConnectContext = { pc: RTCPeerConnection, audio: HTMLAudioElement };

export type IceSwitchInfo = { candidate: RTCIceCandidateInit, etag: string };