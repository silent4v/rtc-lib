export type DataTuple<T = any, U extends any[] = any[]> = [T, ...U];

export type EventCallback<T> = (data: T, ...args: any[]) => void;

export type SocketEvent = string;


/* rtc */
export type RTCGuard = (e :{sdp: string, etag: string}) => void;

export type ConnectRequest = { sdp: RTCSessionDescription, etag: string };

export type ConnectContext = { pc: RTCPeerConnection, audio: HTMLAudioElement };

export type IceSwitchInfo = { candidate: RTCIceCandidateInit, etag: string };