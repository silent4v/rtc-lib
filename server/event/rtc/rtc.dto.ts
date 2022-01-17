export interface SdpForwardRequest {
  sdp: typeof RTCSessionDescription;
  sessionId: string;
  _replyToken: string;
}

export interface SdpForwardResponse {
  sdp: typeof RTCSessionDescription;
  _replyToken: string;
}

export interface CandidateExchangeRequest {
  candidate: string;
  sessionId: string;
}