function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (message.isError) {
    return (
      <div className="message-row">
        <div className="message-avatar ai-avatar">🤖</div>
        <div className="message-content">
          <div
            className="message-bubble ai-bubble"
            style={{
              borderColor: 'rgba(248,81,73,0.4)',
              color: 'var(--error)',
              background: 'rgba(248,81,73,0.08)',
            }}
          >
            ⚠️ {message.errorText || 'An error occurred. Please try again.'}
          </div>
        </div>
      </div>
    );
  }

  // Typing / loading placeholder for streaming with no content yet
  if (message.isStreaming && !message.content) {
    return (
      <div className="message-row">
        <div className="message-avatar ai-avatar">🤖</div>
        <div className="message-content">
          <div className="message-bubble ai-bubble">
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message-row ${isUser ? 'user' : ''}`}>
      <div className={`message-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
          {message.content}
          {message.isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
        </div>
        <div className="message-time">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
}
