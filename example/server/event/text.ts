import { WsClient } from "../interface/client.trait.js"
import { WsServer } from "../server.js";

/* Server-side event hooks */
export function textServerHooks(server: WsServer, client: WsClient) {
  const userTable = server.shareObj.userTable;
  const textChannel = server.shareObj.textChannel;

  client.on("request::text::subscribe", ([roomId, replyToken]) => {
    if (!textChannel.has(roomId))
      textChannel.set(roomId, []);

    if (client.etag) {
      textChannel.get(roomId)?.push(client.etag);
      client.reply(replyToken, 1);
    } else {
      client.reply(replyToken, 0);
    }
  });

  client.on("request::text::unsubscribe", ([roomId, replyToken]) => {
    if (!textChannel.has(roomId))
      textChannel.set(roomId, []);

    if (client.etag) {
      const index = textChannel.get(roomId)?.indexOf(client.etag);
      if (index && index !== -1)
        textChannel.get(roomId)?.splice(index, 1);
      client.reply(replyToken, 1);
    } else {
      client.reply(replyToken, 0);
    }
  });

  client.on("text::message", ([{roomId, message}]) => {
    console.log(roomId);
    const room = textChannel.get(roomId);
    if (room) {
      console.log(room);
      room
        //.filter(userTag => userTag !== client.etag)
        .forEach(userTag => {
          console.log(userTag);
          const user = userTable.get(userTag);
          if (user) user.reply("text::message", {
            roomId,
            message,
            who: userTag,
            at: Date.now()
          })
        })
    }
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