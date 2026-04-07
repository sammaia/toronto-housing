import { useState, useCallback } from 'react';
import {
  type ConversationMessage,
  type ConversationDetail,
  type ChatSseEvent,
  getConversation,
  getStoredToken,
} from '@/services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://toronto-housing.onrender.com/api/v1';

interface StreamingState {
  content: string;
  activeTools: string[];
}

interface UseChatStreamReturn {
  messages: ConversationMessage[];
  streaming: StreamingState | null;
  isStreaming: boolean;
  error: string | null;
  loadConversation: (conv: ConversationDetail) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
}

export function useChatStream(
  onTitleGenerated?: (conversationId: string, title: string) => void,
): UseChatStreamReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [streaming, setStreaming] = useState<StreamingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConversation = useCallback((conv: ConversationDetail) => {
    setMessages(conv.messages);
    setStreaming(null);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    setError(null);

    // Optimistically add user message
    const tempUserMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content,
      toolCalls: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setStreaming({ content: '', activeTools: [] });

    const token = getStoredToken();
    let response: Response;

    try {
      response = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });
    } catch {
      setError('Connection failed. Is the backend running?');
      setStreaming(null);
      return;
    }

    if (!response.ok || !response.body) {
      setError(`Request failed (${response.status})`);
      setStreaming(null);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: ChatSseEvent;
          try {
            event = JSON.parse(line.slice(6)) as ChatSseEvent;
          } catch {
            continue;
          }

          if (event.type === 'text') {
            setStreaming((prev) => prev ? { ...prev, content: prev.content + event.content } : null);
          } else if (event.type === 'tool_start') {
            setStreaming((prev) => prev
              ? { ...prev, activeTools: [...prev.activeTools, event.tool] }
              : null,
            );
          } else if (event.type === 'tool_end') {
            setStreaming((prev) => prev
              ? { ...prev, activeTools: prev.activeTools.filter((t) => t !== event.tool) }
              : null,
            );
          } else if (event.type === 'done') {
            const refreshed = await getConversation(event.conversationId);
            setMessages(refreshed.messages);
            setStreaming(null);
            if (event.title) {
              onTitleGenerated?.(event.conversationId, event.title);
            }
          } else if (event.type === 'error') {
            setError(event.message);
            setStreaming(null);
          }
        }
      }
    } catch {
      setError('Stream interrupted');
      setStreaming(null);
    }
  }, [onTitleGenerated]);

  return {
    messages,
    streaming,
    isStreaming: streaming !== null,
    error,
    loadConversation,
    sendMessage,
  };
}
