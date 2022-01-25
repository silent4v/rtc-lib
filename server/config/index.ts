import dotenv from "dotenv";
import { resolve } from "path";

const dd = require("debug")("conf")

const DIRNAME = resolve(__dirname, "..", "..", "..", ".env");

export const config = dotenv.config({ path: `${DIRNAME}` }).parsed;

/* Config check */
const { NODE_ENV, PORT, WS_PORT } = process.env;

if ((!PORT || !WS_PORT) && !NODE_ENV?.includes("test")) {
  const errorBags: Object[] = [];
  console.error("Config Error");
  if (!PORT) errorBags.push({
    key: "PORT",
    message: "PORT not define",
    value: PORT
  });
  if (!WS_PORT) errorBags.push({
    key: "WS_PORT",
    message: "WS_PORT not define",
    value: WS_PORT
  });

  console.info(errorBags);
  process.exit();
}


dd("%O", config);
