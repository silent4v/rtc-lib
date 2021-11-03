import { WsClient } from "../interface/client.trait.js"
import { WsServer } from "../server.js";

/* Server-side event hooks */
export function textServerHooks(server: WsServer, client: WsClient) {
  client.on("request::text::subscribe", ([roomId, replyToken]) => {
    if (client.currentRoom === roomId) {
      client.reply(replyToken, 0);
      return;
    }
    const oldRoom = client.currentRoom ?? "";
    client.currentRoom = roomId;
    server.exitRoom(oldRoom, client);
    server.enterRoom(roomId, client);
    client.reply(replyToken, 1);

    server.broadcast("room::diff", {
      etag: client.etag,
      username: client.username,
      from: oldRoom,
      to: roomId
    });
  });

  client.on("close", () => {
    server.exitRoom(client.currentRoom ?? "", client);
    server.broadcast("room::diff", {
      etag: client.etag,
      username: client.username,
      from: client.currentRoom,
      to: "",
    });
  });
}