import type { ChatRequest, ChatResponse } from "../../../shared/src/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Falha no chat: ${response.status}`);
  }

  return response.json() as Promise<ChatResponse>;
}
