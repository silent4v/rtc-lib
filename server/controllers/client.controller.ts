import type { Client, Server } from "../utils";

const dd = require("debug")("client");

/**
 * @event request::information
 * 
 * @description
 * This event allows clients to query their 
 * own information on the server
 */
export const onInformation = (client: Client, server: Server) =>
  (_, _replyToken: string) => {
    client.sendout(_replyToken, {
      username: client.username,
      sessionId: client.sessionId,
      currentRoom: client.currentRoom,
      subscribedChannel: [...client.subscribedChannel.values()],
    });
  }

/**
 * @event request::register
 *
 * @description
 * The event expects to receive `{ username }` and
 * reply to the user with a server-generated sessionId
 */
export const onRegister = (client: Client, _) =>
  ({ username }, _replyToken: string) => {
    client.username = username;
    client.sendout(_replyToken, {
      sessionId: client.sessionId
    });
    dd("recv %o", { _replyToken, username });
  }

/**
 * @event request::ping-pong
 *
 * @description
 * It's a test event,
 * reply user payload which is user send to server
 */
export const onPingPong = (client: Client, _) =>
  (payload, _replyToken: string) => {
    client.sendout(_replyToken, payload);
  }

export const ClientEventRegistry = (c: Client, s: Server) => {
  c.on("request::information", onInformation(c, s));
  c.on("request::register", onRegister(c, s));
  c.on("request::ping-pong", onPingPong(c, s));
}