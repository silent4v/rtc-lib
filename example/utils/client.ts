import type { WebSocket } from "ws";
import { createHash } from "crypto";
import { performance } from "perf_hooks";
import { channelRef } from "./channel.js";
import { roomRef } from "./room.js";
import parse from "fast-json-parse";
import debug from "debug";
import { inspect } from "util";

const openDebug = debug("Client:open");
const eventDebug = debug("Client:event");
const methodDebug = debug("Client:invoke");

let appCount = 0;

interface Result<T = any> {
  err: any;
  value: {
    eventType: string;
    payload: T;
    $replyToken: string
  }
}

export interface ClientExtension {
  username: string;
  sessionId: string;
  sid: string;
  subscribedChannel: Set<string>;
  currentRoom: string;
  exit: () => void;
  enter: (roomName: string) => void;
  subscribe: (channelName: string) => void;
  unsubscribe: (channelName: string) => void;
  only: (channelName: string) => void;
  sendout: <T = any>(eventType: string, payload: T) => void;
}

export type Client = WebSocket & ClientExtension;

export function clientInit(sock: WebSocket) {
  appCount = (appCount + 1) % 0xfffff;
  const timestamp = Date.now();
  const chunk = `${timestamp}${performance.now()}${appCount}`;
  const sessionId = createHash("sha224").update(chunk).digest("hex");

  sock.on("message", function proxyEvent(buf) {
    const rawData = buf.toString("utf8");
    const result = parse(rawData) as Result;
    if (!result.err) {
      const { eventType, payload, $replyToken } = result.value;
      if (eventType && typeof eventType === "string") {
        sock.emit(eventType, payload, $replyToken);
        eventDebug("%s %s %s", eventType, inspect(payload, false, 3, true) , $replyToken);
      }
    }
  });

  let self = sock as Client;
  Object.defineProperties(sock, {
    username: {
      value: "$NONE",
      writable: true
    },
    sessionId: {
      value: sessionId,
      writable: false
    },
    sid: {
      value: sessionId.slice(0, 8),
      writable: false
    },
    subscribedChannel: {
      value: new Set()
    },
    currentRoom: {
      value: "$NONE",
      writable: true
    },
    exit: {
      value: () => {
        roomRef.container.get(self.currentRoom)?.delete(self.sessionId);
        self.currentRoom = "$NONE";
      }
    },
    enter: {
      value: (roomName: string) => {
        methodDebug("from %s to %s", self.currentRoom, roomName);
        roomRef.enter(self.sessionId, roomName);
        self.currentRoom = roomName;
      }
    },
    subscribe: {
      value: (channelName: string) => {
        channelRef.subscribe(sessionId, channelName);
        self.subscribedChannel.add(channelName);
        methodDebug("%s current subscribe: %o", self.sid, self.subscribedChannel);
      }
    },
    unsubscribe: {
      value: (channelName: string) => {
        channelRef.unsubscribe(sessionId, channelName);
        self.subscribedChannel.delete(channelName);
        methodDebug("%s current unsubscribe: %o", self.sid, self.subscribedChannel);
      }
    },
    only: {
      value: (channelName: string) => {
        /* Clear current subscribed */
        self.subscribedChannel.forEach(ch => channelRef.unsubscribe(sessionId, ch));
        self.subscribedChannel.clear();

        /* Trace new channel */
        channelRef.subscribe(sessionId, channelName);
        self.subscribedChannel.add(channelName);
        methodDebug("%s current subscribe: %o", self.sid, self.subscribedChannel);
      }
    },
    sendout: {
      value: <T = any>(eventType: string, payload: T) => {
        const data = JSON.stringify({ eventType, payload });
        sock.send(data);
      }
    },
  });
  openDebug("sessionId: %s", sessionId);
  return self;
}