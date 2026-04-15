import { Router } from "express";
import type { ChatRequest } from "../../../shared/src/types.js";
import { processChat } from "../agent/chatAgent.js";

const router = Router();

router.post("/chat", (req, res) => {
  const body = (req.body ?? {}) as ChatRequest;
  const response = processChat(body);
  res.json(response);
});

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "dogfinder-backend" });
});

export default router;
