export interface SubscribeRequest {
  channelName: string;
  $replyToken: string;
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

export interface SubscribeResponse {
  state: number;
  /* 
    1 - The user sub/unsub an existing room
    2 - The user sub/unsub an NOT existing room
   */
}

export interface TalkMessageResponse {
  channelName: string,
  type: "text" | "image",
  message: any,
  from: string,
  at: number,
}