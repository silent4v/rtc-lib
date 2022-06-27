import { Router } from "express";
import {
  appendBanWords,
  currentBanWords,
  setBanWords
} from "../restapi/server.controller";

export const serverSettingRouter = Router();

serverSettingRouter.get("/ban-words", currentBanWords);
serverSettingRouter.post("/ban-words", setBanWords);
serverSettingRouter.put("/ban-words", appendBanWords);