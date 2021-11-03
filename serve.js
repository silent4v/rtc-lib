import express from "express";
import { execSync } from "child_process";

const app = express();
const PORT = 3000;

execSync("npx tsc -p ./tsconfig.json");
app.use("/", express.static('example'))
  .use("/lib", express.static('release/lib'))
  .listen(PORT, '0.0.0.0', () => {
    console.log(`example1@ http://localhost:${PORT}/text.html`);
    console.log(`example2@ http://localhost:${PORT}/video.html`);
  });