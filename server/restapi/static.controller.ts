import type { RequestHandler } from "express";
import { performance } from "perf_hooks";

export const healthChecker: RequestHandler = (_, res) => {
  const runTime = (performance.now() / 1000) | 0;
  let h = (runTime / 3600) | 0;
  let m = (runTime % 3600 / 60) | 0;
  let s = (runTime % 60) | 0;
  res.status(200).end(`running: ${h} hr ${m} min ${s} sec`);
}
