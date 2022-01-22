import type { Client, Server } from "../utils";

const dd = require("debug")("rtc");

const waitingTimeLimit = 60 * 1000;
const activeTable = new Map<string, string>();

/**
 * @event rtc::request
 * 
 * @description
 * The event receives the caller's SDP of a user and callee's session
 * server will forward `_replyToken` to callee,
 * callee can use `_replyToken` responed caller.
 * replyToken will expire after 1 minutes
 */
export const onRtcRequest = (client: Client, server: Server) =>
  ({ sdp, sessionId }, _replyToken) => {
    const targetUser = server.users.get(sessionId);
    if (!targetUser || !sessionId) return;

    activeTable.set(_replyToken, client.sessionId);
    targetUser.sendout("rtc::request", { sdp, sessionId: client.sessionId, _replyToken });
    setTimeout(() => {
      activeTable.delete(_replyToken);
    }, waitingTimeLimit);
    dd("%s calls %s [token:%s]", client.sid, targetUser.sid, _replyToken);
  }

/**
 * @event rtc::response
 * 
 * @description
 * check `activeTable`, ensure token isn't expired,
 * if _replyToken is active, and caller is be find in `userTable`,
 * server forward callee's SDP to caller.
 */
export const onRtcResponse = (client: Client, server: Server) =>
  ({ sdp }, _replyToken) => {
    if( !activeTable.has(_replyToken) ) return;
    const callerSid = activeTable.get(_replyToken) as string;
    const caller = server.users.get(callerSid);
    if(!caller) return;

    /* server forward callee SDP to caller */
    caller.sendout(_replyToken, { sdp , sessionId: client.sessionId});
    activeTable.delete(_replyToken);

    dd("%s reply %s", client.sid, caller.sid);
  }

/**
 * @event rtc::exchange
 * 
 * @description
 * server as forwarder, exchange peer-to-peer ICE candidate.
 */
export const onRtcExchange = (client: Client, server: Server) => 
  ({ candidate, sessionId }) => {
    const targetUser = server.users.get(sessionId);
    if(targetUser)
      targetUser.sendout("rtc::exchange", { candidate, sessionId: client.sessionId });
  }

  export const RtcEventRegistry = (c: Client, s: Server) => {
    c.on("rtc::request", onRtcRequest(c, s));
    c.on("rtc::response", onRtcResponse(c, s));
    c.on("rtc::exchange", onRtcExchange(c, s));
  }
