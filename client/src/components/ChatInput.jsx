import { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, disabled, isStreaming }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    setValue('');
    onSend(text);
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="chat-input-container">
      <textarea
        ref={textareaRef}
        id="chat-input"
        className="chat-textarea"
        placeholder={isStreaming ? 'AI is responding…' : 'Message AI Chat Assistant…'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        aria-label="Chat message input"
        aria-multiline="true"
      />
      <button
        id="send-btn"
        className="send-btn"
        onClick={submit}
        disabled={!canSend}
        aria-label="Send message"
        title="Send (Enter)"
      >
        {isStreaming ? '⏳' : '➤'}
      </button>
    </div>
  );
}
