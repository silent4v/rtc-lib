import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  issueAccessToken,
  verifyAccessToken
} from "../controllers/verify.controller";

export const verifyRouter = Router();
verifyRouter.use(AuthMiddleware);
verifyRouter.get("/access", issueAccessToken);
verifyRouter.post("/access/:token", verifyAccessToken);
