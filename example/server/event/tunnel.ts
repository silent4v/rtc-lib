import { WsClient } from "../interface/client.trait.js"
import { WsServer } from "../server.js";

/* Server-side event hooks */
export function tunnelServerHooks(server: WsServer, client: WsClient) {
  const userTable = server.shareObj.userTable;
  const forwardTable = server.shareObj.forwardTable;
  const threeMinute = 1000 * 60 * 3;
  client.on("rtc::request", ([{ sdp, etag }, replyToken]) => {
    const targetUser = userTable.get(etag);
    console.log(client.etag, targetUser?.etag);
    if (targetUser && client.etag) {
      targetUser.reply("rtc::request", { sdp, etag: client.etag }, replyToken);
      forwardTable.set(replyToken, client.etag);
      setTimeout(function forwardCacheClear() {
        forwardTable.delete(replyToken);
      }, threeMinute);
    }
  });

  client.on("rtc::response", ([{ sdp, etag }, replyToken]) => {
    const reqClientEtag = forwardTable.get(replyToken);
    if (!reqClientEtag) return;

    const targetUser = userTable.get(reqClientEtag);
    console.log(client.etag, targetUser?.etag);
    if (targetUser) {
      targetUser.reply(replyToken, { sdp, etag: client.etag });
      forwardTable.delete(replyToken);
    }
  });

  client.on("rtc::ice_switch", ([candidate, etag]) => {
    const targetUser = userTable.get(etag);
    console.log(client.etag, targetUser?.etag);
    if (targetUser) {
      targetUser.reply("rtc::ice_switch", { candidate, etag: client.etag });
    }
  })
}
