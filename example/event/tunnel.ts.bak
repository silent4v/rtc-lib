import { WsClient } from "../interface/client.trait.js"
import { WsServer } from "../server.js";

/* Server-side event hooks */
export function tunnelServerHooks(server: WsServer, client: WsClient) {
  const userTable = server.shareObj.userTable;
  const forwardTable = server.shareObj.forwardTable;
  const threeMinute = 1000 * 60 * 3;
  client.on("rtc::request", ([{ sdp, sessionId }, replyToken]) => {
    const targetUser = userTable.get(sessionId);
    console.log(client.sessionId, " == request to => ", targetUser?.sessionId);
    if (targetUser && client.sessionId) {
      targetUser.reply("rtc::request", { sdp, sessionId: client.sessionId }, replyToken);
      forwardTable.set(replyToken, client.sessionId);
      setTimeout(function forwardCacheClear() {
        forwardTable.delete(replyToken);
      }, threeMinute);
    }
  });

  client.on("rtc::response", ([{ sdp, sessionId }, replyToken]) => {
    const reqClientSessionId = forwardTable.get(replyToken);
    if (!reqClientSessionId) return;

    const targetUser = userTable.get(reqClientSessionId);
    console.log(targetUser?.sessionId, " <= response to == ", client.sessionId);
    if (targetUser) {
      targetUser.reply(replyToken, { sdp, sessionId: client.sessionId });
      forwardTable.delete(replyToken);
    }
  });

  client.on("rtc::ice_switch", ([candidate, sessionId]) => {
    const targetUser = userTable.get(sessionId);
    console.log(client.sessionId, "<= switch ices =>", targetUser?.sessionId);
    if (targetUser) {
      targetUser.reply("rtc::ice_switch", { candidate, sessionId: client.sessionId });
    }
  })
}
