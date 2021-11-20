import { createServer as createSecureServer } from "https";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { dirname } from "path";
import { performance } from "perf_hooks";
import { fileURLToPath } from 'url';

import { ClientTrait } from "./client.js";
import { WsServer } from "./server.js";
import { roomServerHooks } from "./event/room.js";
import { tunnelServerHooks } from "./event/tunnel.js";
import { textServerHooks } from "./event/text.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* Initial TLS & Default Responder */
//const keyPath = resolve(__dirname, "../cert/rsa.key.pem");
//const certPath = resolve(__dirname, "../cert/rsa.cert.pem");
//const sslConf = {
//  key: readFileSync(keyPath),
//  cert: readFileSync(certPath),
//};
const onRequest = (req: IncomingMessage, res: ServerResponse) => {
  res.end(`Running time: ${(performance.now() | 0) / 1000} second.`);
}

/* Socket Server instance */
const wss = new WsServer({ noServer: true });

wss.defineInitRoom([
  "TextRoom01",
  "TextRoom02",
  "TextRoom03",
  "AudioRoom01",
  "AudioRoom02",
  "AudioRoom03",
])

wss.on("connection", (sock) => {
  const client = ClientTrait.init(wss, sock);

  client.on("usertable", () => {
    client.reply("usertable", [...wss.shareObj.userTable.keys()]);
  })

  client.on("request::register", ([data, replyToken]) => {
    client.sessionId = data.sessionId;
    client.username = data.username;
    client.registered = true;
    if (client.sessionId) {
      console.log("reg:", client.sessionId?.trim(), data.username?.trim());
      wss.userRegister(client.sessionId, client);
      client.reply(replyToken, 1);
    }
  });

  roomServerHooks(wss, client);
  tunnelServerHooks(wss, client);
  textServerHooks(wss, client);
});

/* Run HTTPS server instance */
//createSecureServer(sslConf, onRequest).on("upgrade", (request, socket, head) => {
//  wss.handleUpgrade(request, socket as any, head, function done(ws) {
//    wss.emit("connection", ws, request);
//  });
//}).listen(30000, "0.0.0.0", () => console.log("HTTPS Server run at port:30000"));

/* Run HTTP(Dev) server instance */
createServer(onRequest).on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket as any, head, function done(ws) {
    wss.emit("connection", ws, request);
  });
}).listen(30000, "0.0.0.0", () => console.log("HTTP Server run at port:30000"));;
