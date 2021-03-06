import express from "express";
import { exec, spawn } from "child_process";

const app = express();
const PORT = 3000;

const node = spawn("node", ["./release/example/server/index.js"]);

// node.stdout.on('data', data => console.log(data));
node.stdout.on('data', data => console.log(Buffer.from(data).toString('utf-8')));
node.stderr.on('data', data => console.log(Buffer.from(data).toString('utf-8')));

app.use("/", express.static('example'))
  .use("/", express.static('release'))
  .use("/", express.static('release/lib'))
  .listen(PORT, '0.0.0.0', () => {
    console.log(`example1@ http://localhost:${PORT}/text.html`);
    console.log(`example2@ http://localhost:${PORT}/video.html`);
  });