import { WsClient } from "../interface/client.trait"
import { WsServer } from "../server.js";

/* Server-side event hooks */
export function roomServerHooks(server: WsServer, client: WsClient) {
  client.on("request::room::enter", ([roomId, replyToken]) => {
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

  client.on("request::room::exit", ([roomId, replyToken]) => {
    server.exitRoom(roomId, client);
    client.reply(replyToken, 1);

    server.broadcast("room::diff", {
      etag: client.etag,
      username: client.username,
      from: client.currentRoom,
      to: ""
    });
  });

  client.on("request::room::list", ([roomId, replyToken]) => {
    let rid = roomId ?? "LISTALL";
    const roomState = server.listRoomState(rid);
    client.reply(replyToken, roomState);
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