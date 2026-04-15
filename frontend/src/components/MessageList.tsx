import type { ChatMessage } from "../../../shared/src/types";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <section className="messages">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={message.role === "assistant" ? "message assistant" : "message user"}
        >
          <span className="badge">{message.role === "assistant" ? "DogFinder" : "Tu"}</span>
          <p>{message.content}</p>
        </div>
      ))}
    </section>
  );
}
