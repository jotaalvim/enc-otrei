import { Router } from "express";
import type { ChatRequest } from "../../../shared/src/types.js";
import { processChat } from "../agent/chatAgent.js";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const body = (req.body ?? {}) as ChatRequest;
    const response = await processChat(body);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: "Failed to process chat",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "dogfinder-backend" });
});

export default router;
