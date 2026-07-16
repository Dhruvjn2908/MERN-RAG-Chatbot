function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "10px 14px",
          borderRadius: 12,
          backgroundColor: isUser ? "#2563eb" : "#f1f1f1",
          color: isUser ? "white" : "black",
          whiteSpace: "pre-wrap", // preserves line breaks in the answer text
        }}
      >
        {content || (!isUser ? "..." : "")}
      </div>
    </div>
  );
}

export default MessageBubble;