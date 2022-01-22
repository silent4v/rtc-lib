import dotenv from "dotenv";
import { resolve } from "path";

const dd = require("debug")("conf")

const DIRNAME = resolve(__dirname, "..", "..", "..", ".env");

export const config = dotenv.config({ path: `${DIRNAME}` });
dd("%o", config);
