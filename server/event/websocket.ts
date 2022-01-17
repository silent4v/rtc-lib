import { WebSocketServer } from "ws";
import { regMessengerEvent } from "./messenger/register.js";
import { regRtcEvent } from "./rtc/register.js";
import { regRoomEvent } from "./room/regester.js";
import { clientInit } from "../utils/client.js";
import { serverInit } from "../utils/server.js";
import debug from "debug";

const log = debug("Connection");

export const sockServer = serverInit(new WebSocketServer({ noServer: true }));
sockServer.on("connection", rawSock => {
  const client = clientInit(rawSock);
  sockServer.users.set(client.sessionId, client);
  regMessengerEvent(sockServer, client);
  regRtcEvent(sockServer, client);
  regRoomEvent(sockServer, client);

  client.on("request::register", ({ username }, _replyToken) => {
    log("recv %o", { _replyToken, username });
    client.username = username;
    client.sendout(_replyToken, {
      sessionId: client.sessionId
    });
  });

  client.on("request::ping-pong", (payload, _replyToken) => {
    /* For testing event, return origin payload */
    client.sendout(_replyToken, payload);
  })
});