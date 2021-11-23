import { Server } from "../../utils/server.js";
import { Client } from "../../utils/client.js";
import debug from "debug";
import { roomRef } from "example/utils/room.js";

export function regRoomEvent(server: Server, client: Client) {
  const roomDebug = debug("room");

  client.on("request::room::enter", ({ roomName, $replyToken }) => {
    roomDebug("request::room::enter , arg: %s", roomName);
    if (client.currentRoom === roomName) {
      client.sendout($replyToken, 0);
      return;
    }
    const from = client.currentRoom;
    const to = roomName;
    client.enter(roomName);
    client.sendout($replyToken, 1);

    server.broadcast("room::diff", {
      sessionId: client.sessionId,
      username: client.username,
      from,
      to
    });
  });

  client.on("request::room::exit", ({ $replyToken }) => {
    roomDebug("request::room::exit");
    const from = client.currentRoom;
    const to = "$NONE";

    client.exit();
    client.sendout($replyToken, 1);
    server.broadcast("room::diff", {
      sessionId: client.sessionId,
      username: client.username,
      from,
      to
    });
  });

  client.on("request::room::list", ({ roomName, $replyToken }) => {
    roomDebug("request::room::list");
    roomRef.list(roomName);
    roomRef
  });

  /* When client disconnected */
  client.on("close", () => {
    server.broadcast("room::diff", {
      sessionId: client.sessionId,
      username: client.username,
      from: client.currentRoom,
      to: "$NONE",
    });
  })
}