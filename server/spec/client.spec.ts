import { WebSocketServer, WebSocket } from "ws";
import { Server, Client, roomRef, channelRef } from "../utils";

let server!: Server;
let client!: Client;

beforeAll(done => {
  const testPort = 10000 + (Math.random() * 5000) | 0;
  const s = new WebSocketServer({ port: testPort });
  server = Server.from(s);
  client = new Client(new WebSocket(`ws://localhost:${testPort}`));
  server.users.set(client.sessionId, client);
  server.on("connection", () => done());
});

afterAll(() => {
  /* Hard Close */
  server.sock.clients.forEach((c) => {
    c.close();
    c.terminate();
  });
  server.sock.close();
});

describe("client wrapper", () => {
  it("default value", () => {
    expect(client.username).toBe("$NONE");
    expect(client.sessionId.length).toBe(56);
    expect(client.sid.length).toBe(8);
    expect(client.subscribedChannel.size).toBe(0);
    expect(client.currentRoom).toBe("$NONE");
  });

  it("behavior: exit/enter room", () => {

    client.enter("testing-room");
    expect(client.currentRoom).toBe("testing-room");
    expect(roomRef.container.get("testing-room")).toBeTruthy();

    client.exit();
    expect(client.currentRoom).toBe("$NONE");
    expect(roomRef.container.get("testing-room")?.size).toBe(0);

    roomRef.refresh();
    expect(roomRef.container.size).toBe(0);
  });

  it("behavior: unsubscribe/subscribe ch", () => {
    client.subscribe("testing-ch1");
    client.subscribe("testing-ch2");
    expect(client.subscribedChannel).toEqual(new Set([
      "testing-ch1",
      "testing-ch2"
    ]));
    expect(channelRef.container.has("testing-ch1")).toBeTruthy();
    expect(channelRef.container.has("testing-ch2")).toBeTruthy();
    expect(channelRef.container.size).toBe(2);
    expect(channelRef.list()).toEqual([
      {
        name: "testing-ch1",
        clients: [client.sessionId],
        type: "$channel"
      },
      {
        name: "testing-ch2",
        clients: [client.sessionId],
        type: "$channel"
      },
    ]);

    client.unsubscribe("testing-ch1");
    client.unsubscribe("testing-ch2");
    channelRef.refresh();
    expect(channelRef.container.size).toBe(0);
    expect(channelRef.list()).toEqual([]);

    client.subscribe("testing-ch1");
    client.subscribe("testing-ch2");
    client.subscribe("testing-ch3");
    client.subscribe("testing-ch4");
    client.only("testing-ch1");
    expect(client.subscribedChannel).toEqual(new Set(["testing-ch1"]));
  });
});