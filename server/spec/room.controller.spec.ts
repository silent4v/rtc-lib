import { WebSocketServer, WebSocket } from "ws";
import { Server, Client, channelRef, roomRef } from "../utils";
import {
  onEnter,
  onExit,
  onFollow,
  onList
} from "../controllers/room.controller";
import { networkInterfaces } from "os";

let server!: Server;
let client!: Client;

beforeAll(done => {
  const testPort = 10000 + (Math.random() * 5000) | 0;
  const s = new WebSocketServer({ port: testPort });
  client = new Client(new WebSocket(`ws://localhost:${testPort}`));
  server = new Server(s);
  server.users.set(client.sessionId, client);
  server.on("connection", () => done());

  /* For test mock function */
  client.sendout = (eventType: any, data: any) => {
    client.sock.emit(eventType, data);
  }
});

afterAll(() => {
  /* Hard Close */
  server.sock.clients.forEach((c) => {
    c.close();
    c.terminate();
  });
  server.sock.close();
});

describe("messenger.controller websocket event", () => {
  it("check initial client value", () => {
    expect(client.currentRoom).toBe("$NONE");
  });

  it("when user enter room", done => {
    client.once("room::test", () => {
      expect(client.currentRoom).toBe("room3");
      done();
    });
    onEnter(client, server)("room1", "_");
    onEnter(client, server)("room2", "_");
    onEnter(client, server)("room3", "room::test");
  });

  it("when user exit room", done => {
    client.once("room::test", () => {
      expect(client.currentRoom).toBe("$NONE");
      done();
    });
    onExit(client, server)(null, "room::test");
  });

  it("when user request list all room", done => {
    client.once("room::test", recData => {
      expect(recData).toStrictEqual([
        {
          name: "room1",
          clients: [],
          type: "$room"
        },
        {
          name: "room2",
          clients: [],
          type: "$room"
        },
        {
          name: "room3",
          clients: [],
          type: "$room"
        }
      ]);
      done();
    });
    onList(client, server)("$DEFAULT", "room::test");
  });

  it("when user request list spec room", done => {
    client.once("room::test", recData => {
      expect(recData).toStrictEqual([
        {
          name: "room1",
          clients: [],
          type: "$room"
        },
      ]);
      done();
    });
    onList(client, server)("room1", "room::test");
  });

  it("when user request list not exist room", done => {
    client.once("room::test", recData => {
      expect(recData).toStrictEqual([
        {
          name: "room4",
          clients: [],
          type: "$room"
        },
      ]);
      done();
    });
    onList(client, server)("room4", "room::test");
  });

  it("when user use token enter room", done => {
    const expireTimer = roomRef.setExpireToken("test-token", "testRoom");
    client.once("room::test", recData => {
      expect(client.currentRoom).toBe("testRoom");
      expect([...client.subscribedChannel.values()]).toStrictEqual(["testRoom"]);
      clearTimeout(expireTimer);
      done();
    });

    /* enter room & sub mutli channel */
    client.enter("room");
    client.subscribe("ch1");
    client.subscribe("ch2");
    expect(client.currentRoom).toBe("room");
    expect([...client.subscribedChannel.values()]).toStrictEqual([
      "ch1", "ch2"
    ]);
    onFollow(client, server)("test-token", "room::test")
  });
});