export interface SdpForwardRequest {
  sdp: typeof RTCSessionDescription;
  sessionId: string;
  $replyToken: string;
}

export interface SdpForwardResponse {
  sdp: typeof RTCSessionDescription;
  $replyToken: string;
}

export interface CandidateExchangeRequest {
  candidate: string;
  sessionId: string;
}