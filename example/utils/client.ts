import type { WebSocket } from "ws";
import { createHash } from "crypto";
import { performance } from "perf_hooks";
import { channelRef } from "./channel.js";
import { roomRef } from "./room.js";
import parse from "fast-json-parse";
import debug from "debug";

const openDebug = debug("Client:open");
const eventDebug = debug("Client:event");
const methodDebug = debug("Client:invoke");

let appCount = 0;

interface Result<T = any> {
  err: any;
  value: {
    eventType: string;
    payload: T;
  }
}

export interface ClientExtension {
  username: string;
  sessionId: string;
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
      const { eventType, payload } = result.value;
      if (eventType && typeof eventType === "string") {
        sock.emit(eventType, payload);
        eventDebug(result.value);
      }
    }
  });

  let self = sock as Client;
  Object.defineProperties(sock, {
    username: {
      value: "",
    },
    sessionId: {
      value: sessionId
    },
    subscribedChannel: {
      value: new Set()
    },
    currentRoom: {
      value: "$NONE"
    },
    exit: {
      value: () => {
        roomRef.container.get(self.currentRoom)?.delete(self.sessionId);
        self.currentRoom = "$NONE";
        methodDebug("current room: %o", self.currentRoom);
      }
    },
    enter: {
      value: (roomName: string) => {
        roomRef.enter(self.sessionId, roomName);
        methodDebug("current room: %o", self.currentRoom);
      }
    },
    subscribe: {
      value: (channelName: string) => {
        channelRef.subscribe(sessionId, channelName);
        self.subscribedChannel.add(channelName);
        methodDebug("current subscribe: %o", self.subscribedChannel);
      }
    },
    unsubscribe: {
      value: (channelName: string) => {
        channelRef.unsubscribe(sessionId, channelName);
        self.subscribedChannel.delete(channelName);
        methodDebug("current unsubscribe: %o", self.subscribedChannel);
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
        methodDebug("current subscribe: %o", self.subscribedChannel);
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