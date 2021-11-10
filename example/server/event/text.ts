import { WsClient } from "../interface/client.trait.js"
import { WsServer } from "../server.js";

/* Server-side event hooks */
export function textServerHooks(server: WsServer, client: WsClient) {
  const userTable = server.shareObj.userTable;
  const textChannel = server.shareObj.textChannel;

  client.on("request::text::subscribe", ([roomId, replyToken]) => {
    if (!textChannel.has(roomId))
      textChannel.set(roomId, []);

    if (client.sessionId) {
      textChannel.get(roomId)?.push(client.sessionId);
      client.reply(replyToken, 1);
    } else {
      client.reply(replyToken, 0);
    }
  });

  client.on("request::text::unsubscribe", ([roomId, replyToken]) => {
    if (!textChannel.has(roomId))
      textChannel.set(roomId, []);

    if (client.sessionId) {
      const index = textChannel.get(roomId)?.indexOf(client.sessionId);
      if (index && index !== -1)
        textChannel.get(roomId)?.splice(index, 1);
      client.reply(replyToken, 1);
    } else {
      client.reply(replyToken, 0);
    }
  });

  client.on("request::text::message", ([{ roomId, message }, replyToken]) => {
    console.log(roomId);
    const room = textChannel.get(roomId);
    if (room) {
      console.log(room);
      room
        .filter(userTag => userTag !== client.sessionId)
        .forEach(userTag => {
          console.log(userTag);
          const user = userTable.get(userTag);
          if (user) user.reply("text::message", {
            roomId,
            message,
            from: client.sessionId + "::" + client.username,
            at: Date.now()
          })
        });
      client.reply(replyToken, 1);
    }
    client.reply(replyToken, 0);
  });

  client.on("close", () => {
    server.exitRoom(client.currentRoom ?? "", client);
    server.broadcast("room::diff", {
      sessionId: client.sessionId,
      username: client.username,
      from: client.currentRoom,
      to: "",
    });
  });
}