import { WebSocketServer, WebSocket } from "ws";
import { Server, Client } from "../utils";
import {
  onRtcRequest,
  onRtcResponse,
  onRtcExchange
} from "../controllers/rtc.controller";

let server!: Server;
let c1!: Client;
let c2!: Client;

beforeAll(done => {
  const testPort = 10000 + (Math.random() * 5000) | 0;
  const s = new WebSocketServer({ port: testPort });
  server = Server.from(s);
  c1 = new Client(new WebSocket(`ws://localhost:${testPort}`));
  c2 = new Client(new WebSocket(`ws://localhost:${testPort}`));
  server.users.set(c1.sessionId, c1);
  server.users.set(c2.sessionId, c2);
  server.on("connection", () => {
    const latcher = setInterval(() => {
      if (c1.sock.readyState === 1 && c2.sock.readyState === 1) {
        done();
        clearInterval(latcher);
      }
    });
  });

  c1.sendout = (e: any, data: any) => c1.sock.emit(e, data);
  c2.sendout = (e: any, data: any) => c2.sock.emit(e, data);
});

afterAll(() => {
  /* Hard Close */
  server.sock.clients.forEach((c) => {
    c.close();
    c.terminate();
  });
  server.sock.close();
});

describe("rtc.controller websocket event", () => {
  it("when c1 calls to c2", done => {
    c2.once("rtc::request", recData => {
      expect(recData).toStrictEqual({
        sdp: "SDP",
        sessionId: c1.sessionId,
        _replyToken: "rtc::test1"
      });
      done();
    });

    const timer = onRtcRequest(c1, server)({
      sdp: "SDP",
      sessionId: c2.sessionId
    }, "rtc::test1");
    clearTimeout(timer as any);
  });

  it("when c2 reply to c1", done => {
    c2.once("rtc::request", () => {
      onRtcResponse(c2, server)({
        sdp: "SDP2"
      }, "rtc::test2")
    });

    c1.once("rtc::test2", recData => {
      expect(recData).toStrictEqual({
        sdp: "SDP2",
        sessionId: c2.sessionId
      });
      done(); // when c1 receive response, rtc connect-test done.
    })

    const timer = onRtcRequest(c1, server)({
      sdp: "SDP",
      sessionId: c2.sessionId
    }, "rtc::test2");
    clearTimeout(timer as any);
  });
});