import type { Client } from "../../utils/client.js";
import type { Server } from "../../utils/server.js";

import { CandidateExchangeRequest, SdpForwardRequest, SdpForwardResponse } from "./rtc.dto.js";
import debug from "debug";

export function regRtcEvent(server: Server, client: Client) {
  const rtcDebug = debug("Rtc");
  const matchTable = new Map<string, string>();
  const waitingTimelimit = 60 * 1000; // 1 minute

  client.on("rtc::request", ({ sdp, sessionId, _replyToken }: SdpForwardRequest) => {
    const targetUser = server.users.get(sessionId);
    if (!targetUser || !sessionId) return;

    targetUser.sendout("rtc::request", { sdp, sessionId, _replyToken });
    matchTable.set(_replyToken, client.sessionId);
    rtcDebug("%s calls %s", client.sid, targetUser.sid);
    setTimeout(function noneResponse() {
      matchTable.delete(_replyToken);
    }, waitingTimelimit)
  });

  client.on("rtc::response", ({ sdp, _replyToken }: SdpForwardResponse) => {
    const originCallerId = matchTable.get(_replyToken);
    const originCaller = server.users.get(originCallerId ?? "");
    if (!originCaller) return;

    originCaller.sendout(_replyToken, { sdp, sessionId: client.sessionId });
    matchTable.delete(_replyToken);
    rtcDebug("%s response %s", originCaller.sid, client.sid);
  });

  client.on("rtc::exchange", ({ candidate, sessionId }: CandidateExchangeRequest) => {
    const targetUser = server.users.get(sessionId);
    if (targetUser)
      targetUser.sendout("rtc::exchange", { candidate, sessionId: client.sessionId });
  })
}