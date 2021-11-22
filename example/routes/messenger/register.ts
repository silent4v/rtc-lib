import type { Client } from "../../utils/client.js";
import type { Server } from "../../utils/server.js";
import { channelRef } from "../../utils/channel.js";
import { SubscribeRequest, TalkMessageRequest, TalkMessageResponse, UnsubscribeRequest } from "./messenger.dto.js";
import debug from "debug";
const messengerDebug = debug("Messenger");

export function regMessengerEvent(server: Server, client: Client) {
  client.on("request::text::subscribe", ({ channelName, $replyToken }: SubscribeRequest) => {
    const exists = channelRef.map.get(channelName) !== undefined;
    client.subscribe(channelName);
    client.sendout($replyToken, { state: exists ? 1 : 0 });
    messengerDebug("'%s' subscribe '%s'", `${client.sessionId.slice(0,8)}::${client.username}`, channelName);
  });

  client.on("request::text::unsubscribe", ({ channelName, $replyToken }: UnsubscribeRequest) => {
    const exists = channelRef.map.get(channelName) !== undefined;
    if (exists) {
      client.unsubscribe(channelName);
    }
    client.sendout($replyToken, { state: exists ? 1 : 0 });
    messengerDebug("%s unsubscribe %s", `${client.sessionId.slice(0,8)}::${client.username}`, channelName);
  });

  client.on("request::text::message", ({ channelName, message, $replyToken }: TalkMessageRequest) => {
    const clients = channelRef.map.get(channelName);
    if(!clients) return client.sendout($replyToken, 0);
    
    const recvTime = Date.now();
    const data: TalkMessageResponse = {
      channelName,
      type: "text",
      message,
      from: `${client.sessionId}::${client.username}`,
      at: recvTime
    };
    clients.forEach( client => {
      server.users.get(client)?.sendout("text::message", data);
    });
    client.sendout($replyToken, recvTime);
    messengerDebug("%s will broadcast: %s", channelName, message);
  });

  client.on("close", () => {
    client.subscribedChannel.forEach(channelName => client.unsubscribe(channelName));
  })
}