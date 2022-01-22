import { WebSocketServer, WebSocket } from "ws";
import { Server, Client } from "../utils";
import {
  onInformation, onPingPong, onRegister
} from "../controllers/client.controller";

let server!: Server;
let client!: Client;

beforeAll(done => {
  const testPort = 10000 + (Math.random() * 5000) | 0;
  const s = new WebSocketServer({ port: testPort });
  server = new Server(s);
  client = new Client(new WebSocket(`ws://localhost:${testPort}`));
  server.users.set(client.sessionId, client);
  server.on("connection", () => done());

  /* For test mock function */
  client.sendout = (eventType: any, data: any) => {
    client.sock.emit(eventType, data)
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

describe("client.controller websocket event", () => {
  it("Check registered username is correct", done => {
    client.once("client::test", recData => {
      expect(recData.sessionId).toBe(client.sessionId);
      expect(client.username).toBe("username");
      done();
    });
    onRegister(client, server)({ username: "username" }, "client::test");
  });

  it("then, request self information", done => {
    client.once("client::test", recData => {
      expect(recData.currentRoom).toBe("$NONE");
      expect(recData.subscribedChannel).toStrictEqual([]);
      done();
    });
    onInformation(client, server)(null, "client::test");
  });

  it("finally, check ping-pong event", done => {
    const testData = {
      number: 30,
      nestedObj: {
        arr: [],
        str: "string",
        float: 123.45,
        boolean: true
      }
    };

    client.once("client::test", recData => {
      expect(recData).toBe(testData);
      done();
    });
    onPingPong(client, server)(testData, "client::test");
  });
});