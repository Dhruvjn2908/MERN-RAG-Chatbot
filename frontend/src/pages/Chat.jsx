import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import MessageBubble from "../components/MessageBubble.jsx";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const { logout } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isStreaming) return;

    setInput("");
    // Add the user's message, and an empty assistant placeholder we'll
    // fill in piece by piece as chunks arrive.
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/chat/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, conversationId }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode this chunk of raw bytes into text, and add it to
        // whatever partial text we're still holding from last time.
        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by a blank line. Split on that --
        // but the LAST piece might be an incomplete message (the network
        // chunk could cut off mid-message), so we keep it in the buffer
        // for the next read instead of processing it early.
        const messages_ = buffer.split("\n\n");
        buffer = messages_.pop();

        for (const rawMessage of messages_) {
          if (!rawMessage.trim()) continue;
          handleServerMessage(rawMessage);
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleServerMessage(rawMessage) {
    const lines = rawMessage.split("\n");
    let eventName = "message"; // default when there's no explicit "event:" line
    let dataLine = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) eventName = line.slice(7).trim();
      if (line.startsWith("data: ")) dataLine = line.slice(6);
    }

    if (dataLine === "[DONE]") return;

    const parsed = JSON.parse(dataLine);

    if (eventName === "meta") {
      // Only matters for a brand new conversation -- this is how the
      // frontend learns the id the backend just created.
      setConversationId(parsed.conversationId);
    } else if (eventName === "sources") {
      // We're not displaying these yet -- available here if you want to
      // show "N sources found" or a citations panel later.
    } else if (parsed.text) {
      // Append this piece of text onto the LAST message (the assistant
      // placeholder we added when the user hit send).
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, content: last.content + parsed.text };
        return updated;
      });
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>RAG Chatbot</h2>
        <button onClick={logout}>Log out</button>
      </div>

      <div style={{ minHeight: 400, marginBottom: 16 }}>
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isStreaming}
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" disabled={isStreaming}>
          {isStreaming ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default Chat;