import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  issueAccessToken,
  verifyAccessToken
} from "../controllers/verify.controller";

export const verifyRouter = Router();
verifyRouter.use(AuthMiddleware);
verifyRouter.post("/access", issueAccessToken);
verifyRouter.get("/access/:token", verifyAccessToken);
