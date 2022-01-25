import { WebSocketServer, WebSocket } from "ws";
import { Server, Client, channelRef } from "../utils";
import {
  onSubscribe,
  onTextMessage,
  onUnsubscribe
} from "../controllers/messenger.controller";

let server!: Server;
let client!: Client;

beforeAll(done => {
  const testPort = 10000 + (Math.random() * 5000) | 0;
  const s = new WebSocketServer({ port: testPort });
  server = Server.from(s);
  client = new Client(new WebSocket(`ws://localhost:${testPort}`));
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

const EXIST = 1;
const NOT_EXIST = 2;

describe("messenger.controller websocket event", () => {
  it("when user subscribe not exist channel", done => {
    client.once("text::test", recData => {
      expect(recData.state).toBe(NOT_EXIST);
      expect([...client.subscribedChannel.values()]).toStrictEqual(["channel1"]);
      done();
    });
    onSubscribe(client, server)("channel1", "text::test");
  });

  it("when user subscribe exist channel", done => {
    client.once("text::test", recData => {
      expect(recData.state).toBe(EXIST);
      expect([...client.subscribedChannel.values()]).toStrictEqual(["channel1"]);
      done();
    });
    onSubscribe(client, server)("channel1", "text::test")
  });

  it("when user unsubscribe exist channel", done => {
    client.once("text::test", recData => {
      expect(recData.state).toBe(EXIST);
      expect([...client.subscribedChannel.values()]).toStrictEqual([]);
      done();
    });
    onUnsubscribe(client, server)("channel1", "text::test")
  });

  it("when user unsubscribe not exist channel", done => {
    client.once("text::test", recData => {
      expect(recData.state).toBe(NOT_EXIST);
      expect([...client.subscribedChannel.values()]).toStrictEqual([]);
      done();
    });
    channelRef.refresh(); // clean the channel map
    onUnsubscribe(client, server)("channel1", "text::test")
  });

  it("when user talk to channel", done => {
    client.once("text::test", recData => {
      expect(typeof recData).toBe("number");
      expect(Date.now() - recData).toBeGreaterThan(0);
      done();
    });
    onTextMessage(client, server)({
      channelName: "text-ch",
      message: "some-text"
    }, "text::test")
  });
});