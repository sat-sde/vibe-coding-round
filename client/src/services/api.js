const BASE_URL = '/api';

export const conversationService = {
  /**
   * Fetch all conversations (sidebar list)
   */
  async getAll() {
    const res = await fetch(`${BASE_URL}/conversations`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch conversations');
    }
    return res.json();
  },

  /**
   * Fetch a single conversation by ID (with messages)
   */
  async getById(id) {
    const res = await fetch(`${BASE_URL}/conversations/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch conversation');
    }
    return res.json();
  },

  /**
   * Create a new conversation (optional title)
   */
  async create(title) {
    const res = await fetch(`${BASE_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create conversation');
    }
    return res.json();
  },

  /**
   * Delete a conversation
   */
  async delete(id) {
    const res = await fetch(`${BASE_URL}/conversations/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete conversation');
    }
    return res.json();
  },
};

/**
 * Stream a chat message via SSE.
 * @param {object} params
 * @param {string|null} params.conversationId
 * @param {string} params.message
 * @param {string} params.tone
 * @param {function} params.onDelta - called with each text chunk
 * @param {function} params.onDone - called with full content and conversationId
 * @param {function} params.onError - called with error message
 * @returns {AbortController} - call .abort() to cancel
 */
export const streamChat = ({ conversationId, message, tone, onDelta, onDone, onError, onConversationId }) => {
  const controller = new AbortController();

  const run = async () => {
    try {
      const res = await fetch(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message, tone }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onError(err.message || err.error || `HTTP ${res.status}`);
        return;
      }

      // Parse SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let returnedConversationId = conversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE lines: "data: {...}\n\n"
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.type === 'delta') {
                onDelta(payload.content);
              } else if (payload.type === 'done') {
                onDone(payload.content, returnedConversationId);
              } else if (payload.type === 'error') {
                onError(payload.message || 'Stream error');
              } else if (payload.type === 'conversationId') {
                returnedConversationId = payload.conversationId;
                if (onConversationId) onConversationId(payload.conversationId);
              }
            } catch {
              // ignore malformed JSON lines
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError(err.message || 'Network error');
      }
    }
  };

  run();
  return controller;
};
