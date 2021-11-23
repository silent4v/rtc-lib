import type { Client } from "../../utils/client.js";
import type { Server } from "../../utils/server.js";

import { CandidateExchangeRequest, SdpForwardRequest, SdpForwardResponse } from "./rtc.dto.js";
import debug from "debug";

export function regRtcEvent(server: Server, client: Client) {
  const rtcDebug = debug("rtc");
  const matchTable = new Map<string, string>();
  const waitingTimelimit = 60 * 1000; // 1 minute

  client.on("rtc::request", ({ sdp, sessionId, $replyToken }: SdpForwardRequest) => {
    const targetUser = server.users.get(sessionId);
    if (!targetUser || !sessionId) return;

    targetUser.sendout("rtc::request", { sdp, sessionId, $replyToken });
    matchTable.set($replyToken, client.sessionId);
    rtcDebug("%s calls %s", client.sid, targetUser.sid);
    setTimeout(function noneResponse() {
      matchTable.delete($replyToken);
    }, waitingTimelimit)
  });

  client.on("rtc::response", ({ sdp, $replyToken }: SdpForwardResponse) => {
    const originCallerId = matchTable.get($replyToken);
    const originCaller = server.users.get(originCallerId ?? "");
    if (!originCaller) return;

    originCaller.sendout($replyToken, { sdp, sessionId: client.sessionId });
    matchTable.delete($replyToken);
    rtcDebug("%s response %s", originCaller.sid, client.sid);
  });

  client.on("rtc::exchange", ({ candidate, sessionId }: CandidateExchangeRequest) => {
    const targetUser = server.users.get(sessionId);
    if (targetUser)
      targetUser.sendout("rtc::exchange", { candidate, sessionId: client.sessionId });
  })
}