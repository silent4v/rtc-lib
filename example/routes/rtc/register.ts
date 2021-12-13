import type { Client } from "../../utils/client.js";
import type { Server } from "../../utils/server.js";

import { CandidateExchangeRequest, SdpForwardRequest, SdpForwardResponse } from "./rtc.dto.js";
import debug from "debug";

const matchTable = new Map<string, string>();
export function regRtcEvent(server: Server, client: Client) {
  const rtcDebug = debug("Rtc");
  const waitingTimelimit = 60 * 1000; // 1 minute

  client.on("rtc::request", ({ sdp, sessionId }: SdpForwardRequest, _replyToken) => {
    const targetUser = server.users.get(sessionId);
    if (!targetUser || !sessionId) return;

    targetUser.sendout("rtc::request", { sdp, sessionId: client.sessionId, _replyToken });
    matchTable.set(_replyToken, client.sessionId);
    rtcDebug("%s -> %s", _replyToken, client.sessionId)
    rtcDebug("%s calls %s", client.sid, targetUser.sid);
    setTimeout(function noneResponse() {
      matchTable.delete(_replyToken);
    }, waitingTimelimit)
  });

  client.on("rtc::response", ({ sdp }: SdpForwardResponse, _replyToken) => {
    const originCallerId = matchTable.get(_replyToken);
    const originCaller = server.users.get(originCallerId ?? "");
    rtcDebug("Should reply event %s, user is %s", _replyToken, originCallerId?.slice(0,8));
    if (!originCaller) return;

    originCaller.sendout(_replyToken, { sdp, sessionId: client.sessionId });
    matchTable.delete(_replyToken);
    rtcDebug("%s response %s", originCaller.sid, client.sid);
  });

  client.on("rtc::exchange", ({ candidate, sessionId }: CandidateExchangeRequest) => {
    const targetUser = server.users.get(sessionId);
    rtcDebug("%s <=> %s", client.sid, targetUser?.sid);
    if (targetUser)
      targetUser.sendout("rtc::exchange", { candidate, sessionId: client.sessionId });
  })
}