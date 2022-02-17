import { resolve } from "path";
import type { UserData } from "..//utils/room";
import type { Client, Server } from "../utils";
import { channelRef } from "../utils";

const dd = require("debug")("messenger");
const EXIST = 1;
const NOT_EXIST = 2;

/**
 * @event request::text::subscribe
 *
 * @description
 * let client trace message from specific channel.
 * if client enter EXIST room, reply `{ state: 1 }`; else `{ state : 2 }`
 */
export const onSubscribe = (client: Client, _) =>
  (channelName: string, _replyToken: string) => {
    const isExists = channelRef.container.has(channelName);
    client.subscribe(channelName);
    client.sendout(_replyToken, { state: isExists ? EXIST : NOT_EXIST });
    dd("%s sub %s", `${client.sid}::${client.username}`, channelName);
  }

/**
 * @event request::text::unsubscribe
 *
 * @description
 * let client stop trace message from specific channel.
 * if client leave EXIST room, reply `{ state: 1 }`; else `{ state : 2 }`
 */
export const onUnsubscribe = (client: Client, _) =>
  (channelName: string, _replyToken: string) => {
    const isExists = channelRef.container.has(channelName);
    if (isExists) client.unsubscribe(channelName);
    client.sendout(_replyToken, { state: isExists ? EXIST : NOT_EXIST });
    dd("%s Unsub %s", `${client.sid}::${client.username}`, channelName);
  }

/**
 * @event request::text::message
 * 
 * @description
 * receive channel and message, then broadcast message to channel
 * reply timestamp at broadcast time to talker
 */
export const onTextMessage = (client: Client, server: Server) =>
  ({ channelName, message }: TalkMessageRequest, _replyToken: string) => {
    const clients = channelRef.container.get(channelName);
    if (!clients) return client.sendout(_replyToken, 0);

    const recvTime = Date.now();
    const data: TalkMessageResponse = {
      channelName,
      type: "text",
      message,
      from: `${client.sessionId}::${client.username}`,
      userData: client.userData,
      at: recvTime
    }

    /* broadcast message to others at same room */
    clients.forEach(client => {
      server.users.get(client)?.sendout("text::message", data);
    });
    client.sendout(_replyToken, recvTime);
    dd("@%s : %s", channelName, message);
  }

export const MsgEventRegistry = (c: Client, s: Server) => {
  const textMessageHandler = onTextMessage(c, s);
  c.on("request::text::subscribe", onSubscribe(c, s));
  c.on("request::text::unsubscribe", onUnsubscribe(c, s));
  c.on("request::text::message", textMessageHandler);
  c.eventPool.set("request::text::message", textMessageHandler as any);
}

export interface TalkMessageResponse {
  channelName: string,
  type: "text" | "image",
  message: any,
  from: string,
  userData: UserData,
  at: number,
}

export interface TalkMessageRequest {
  channelName: string;
  message: string;
}
