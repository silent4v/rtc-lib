export interface SubscribeRequest {
  channelName: string;
  $replyToken: string;
}

export interface SubscribeResponse {
  state: number;
  /* 
    0 - The user did not move
    1 - The user moves to an existing room
    2 - The user creates a room and enters
   */
}

export interface UnsubscribeRequest {
  channelName: string;
  $replyToken: string;
}

export interface TalkMessageRequest {
  channelName: string;
  message: string;
  $replyToken: string;
}

export interface TalkMessageResponse {
  channelName: string,
  type: "text" | "image",
  message: any,
  from: string,
  at: number,
}