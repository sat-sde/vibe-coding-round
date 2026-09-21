export default function Sidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
  onDelete,
  isOpen,
}) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      onDelete(id);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🤖</div>
          <span>AI Chat</span>
        </div>
      </div>

      <div style={{ padding: '12px 12px 0' }}>
        <button className="new-chat-btn" onClick={onNewChat} id="new-chat-btn">
          <span>✏️</span>
          <span>New Chat</span>
        </button>
      </div>

      <div className="sidebar-section-title">Conversations</div>

      <nav className="conversations-list" role="navigation" aria-label="Chat history">
        {conversations.length === 0 ? (
          <div className="sidebar-empty">
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <p>No conversations yet</p>
            <p style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>
              Start a chat to see history here
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              className={`conversation-item ${activeConversationId === conv._id ? 'active' : ''}`}
              onClick={() => onSelect(conv._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(conv._id)}
              id={`conv-${conv._id}`}
              aria-selected={activeConversationId === conv._id}
            >
              <span className="conversation-item-icon">💬</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="conversation-item-title" title={conv.title}>
                  {conv.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {formatDate(conv.updatedAt)}
                </div>
              </div>
              <button
                className="conversation-delete-btn"
                onClick={(e) => handleDelete(e, conv._id)}
                aria-label={`Delete conversation: ${conv.title}`}
                title="Delete"
              >
                🗑
              </button>
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}
