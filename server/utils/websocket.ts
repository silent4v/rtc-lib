import { WebSocketServer } from "ws";
import { Server, Client } from ".";
import { MsgEventRegistry } from "../controllers/messenger.controller";
import { ClientEventRegistry } from "../controllers/client.controller";
import { RoomEventRegistry } from "../controllers/room.controller";
import { RtcEventRegistry } from "../controllers/rtc.controller";
import debug from "debug";

const dd = debug("client");

export const sockServer = Server.from(new WebSocketServer({ noServer: true }));

sockServer.on("connection", (client: Client) => {
  const s = sockServer;
  const c = client;
  dd("client.authorization %s", client.authorization);

  if (!client.authorization) {
    client.sendout("unauthorize", { message: "session end" });
    if (true||!process.env.NODE_ENV?.includes("dev")) {
      client.sock.close();
    }
    return;
  }

  sockServer.users.set(client.sessionId, client);
  MsgEventRegistry(c, s);
  ClientEventRegistry(c, s);
  RoomEventRegistry(c, s);
  RtcEventRegistry(c, s);
});