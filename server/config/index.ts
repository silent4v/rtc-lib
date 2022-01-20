import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { resolve } from "path";

const DIRNAME = resolve(__dirname, "..", "..", "..", ".env");

export const config = dotenv.config({ path: `${DIRNAME}` });
// console.log(config);