import { WebSocketServer } from "ws";
import { Server, Client } from ".";
import { MsgEventRegistry } from "../controllers/messenger.controller";
import { ClientEventRegistry } from "../controllers/client.controller";
import { RoomEventRegistry } from "../controllers/room.controller";
import { RtcEventRegistry } from "../controllers/rtc.controller";
import debug from "debug";

const log = debug("Connection");

export const sockServer = new Server(new WebSocketServer({ noServer: true }));

sockServer.on("connection", (client: Client) => {
  const s = sockServer;
  const c = client;

  sockServer.users.set(client.sessionId, client);
  MsgEventRegistry(c, s);
  ClientEventRegistry(c, s);
  RoomEventRegistry(c, s);
  RtcEventRegistry(c, s);
});