import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ChatInput from './components/ChatInput.jsx';
import ToneSelector from './components/ToneSelector.jsx';
import { conversationService, streamChat } from './services/api.js';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tone, setTone] = useState('professional');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [activeTitle, setActiveTitle] = useState('');
  const streamControllerRef = useRef(null);

  // Load sidebar list on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await conversationService.getAll();
      setConversations(data);
    } catch (err) {
      // DB might not be connected — show empty state instead of crashing
      console.warn('Could not load conversations:', err.message);
    }
  };

  const handleSelectConversation = useCallback(async (id) => {
    if (isStreaming) return; // don't switch mid-stream
    setError(null);
    setLoadingConversation(true);
    setSidebarOpen(false);
    try {
      const data = await conversationService.getById(id);
      setActiveConversationId(data._id);
      setMessages(data.messages || []);
      setActiveTitle(data.title);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConversation(false);
    }
  }, [isStreaming]);

  const handleNewChat = useCallback(() => {
    if (isStreaming) {
      streamControllerRef.current?.abort();
    }
    setActiveConversationId(null);
    setMessages([]);
    setActiveTitle('');
    setError(null);
    setSidebarOpen(false);
  }, [isStreaming]);

  const handleDeleteConversation = useCallback(async (id) => {
    try {
      await conversationService.delete(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      setError(err.message);
    }
  }, [activeConversationId, handleNewChat]);

  const handleSend = useCallback(async (messageText) => {
    if (!messageText.trim() || isStreaming) return;

    setError(null);
    setIsStreaming(true);

    // Optimistic: add user message immediately
    const userMsg = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
      _id: `temp-user-${Date.now()}`,
    };

    // Add placeholder AI message for streaming
    const aiPlaceholder = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      _id: `temp-ai-${Date.now()}`,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);

    const controller = streamChat({
      conversationId: activeConversationId,
      message: messageText.trim(),
      tone,
      onConversationId: (newId) => {
        if (!activeConversationId) {
          setActiveConversationId(newId);
        }
      },
      onDelta: (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === aiPlaceholder._id
              ? { ...m, content: m.content + chunk }
              : m
          )
        );
      },
      onDone: async (fullContent, returnedConvId) => {
        // Finalize the AI message
        setMessages((prev) =>
          prev.map((m) =>
            m._id === aiPlaceholder._id
              ? { ...m, content: fullContent, isStreaming: false }
              : m
          )
        );

        // Update conversation tracking
        const usedConvId = activeConversationId || returnedConvId;
        if (usedConvId && !activeConversationId) {
          setActiveConversationId(usedConvId);
        }

        // Refresh sidebar
        await loadConversations();

        // Update title if this is the first message
        if (!activeTitle && messageText) {
          const shortTitle = messageText.trim().substring(0, 60);
          setActiveTitle(shortTitle);
        }

        setIsStreaming(false);
      },
      onError: (errMsg) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === aiPlaceholder._id
              ? {
                  ...m,
                  content: '',
                  isStreaming: false,
                  isError: true,
                  errorText: errMsg,
                }
              : m
          )
        );
        setError(errMsg);
        setIsStreaming(false);
      },
    });

    streamControllerRef.current = controller;
  }, [activeConversationId, isStreaming, tone, activeTitle]);

  const handleSuggestionClick = (text) => {
    handleSend(text);
  };

  return (
    <div className="app-layout">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        isOpen={sidebarOpen}
      />

      <main className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <div className="chat-header-title">
                {activeTitle || 'AI Chat Assistant'}
              </div>
              <div className="chat-header-subtitle">Powered by OpenAI · GPT-3.5 Turbo</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          loadingConversation={loadingConversation}
          onSuggestionClick={handleSuggestionClick}
        />

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Input area */}
        <div className="chat-input-wrapper">
          <div className="chat-input-inner">
            <ToneSelector tone={tone} onToneChange={setTone} />
            <ChatInput
              onSend={handleSend}
              disabled={isStreaming || loadingConversation}
              isStreaming={isStreaming}
            />
            <div className="input-hint">
              Enter to send · Shift+Enter for newline
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
