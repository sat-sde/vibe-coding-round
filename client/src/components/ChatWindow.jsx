import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';

const SUGGESTIONS = [
  '🔍 Explain quantum computing simply',
  '✍️ Help me write a cover letter',
  '💡 Give me 5 startup ideas',
  '🐛 Debug my Python code',
];

export default function ChatWindow({
  messages,
  isStreaming,
  loadingConversation,
  onSuggestionClick,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loadingConversation) {
    return (
      <div className="chat-window" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: 'float 2s ease-in-out infinite' }}>⏳</div>
          <p>Loading conversation…</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="chat-window">
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <h2>How can I help you today?</h2>
          <p>Start a conversation or pick a suggestion below. Select your preferred tone before sending.</p>
          <div className="empty-state-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => onSuggestionClick(s.replace(/^[\w\W]{2} /, ''))}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window" role="log" aria-live="polite" aria-label="Chat messages">
      <div className="messages-container">
        {messages.map((msg, idx) => (
          <MessageBubble key={msg._id || idx} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
