import { useState, useEffect, useCallback } from 'react';
import {
  type ConversationSummary,
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
} from '@/services/api';
import { useChatStream } from '@/hooks/useChatStream';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatThread } from '@/components/chat/ChatThread';
import { MessageInput } from '@/components/chat/MessageInput';

export function ChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleTitleGenerated = useCallback((convId: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title } : c)),
    );
  }, []);

  const { messages, streaming, isStreaming, error, loadConversation, sendMessage } =
    useChatStream(handleTitleGenerated);

  // Load conversation list on mount
  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch(() => {});
  }, []);

  async function handleNew() {
    const { id } = await createConversation();
    const newConv: ConversationSummary = {
      id,
      title: null,
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(id);
    loadConversation({ id, title: null, messages: [] });
  }

  async function handleSelect(id: string) {
    if (id === activeId) return;
    setActiveId(id);
    const conv = await getConversation(id);
    loadConversation(conv);
  }

  async function handleDelete(id: string) {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      loadConversation({ id: '', title: null, messages: [] });
    }
  }

  async function handleSend(content: string) {
    let convId = activeId;
    if (!convId) {
      const { id } = await createConversation();
      const newConv: ConversationSummary = {
        id,
        title: null,
        updatedAt: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(id);
      convId = id;
    }
    await sendMessage(convId, content);
    // Move active conversation to top of list
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === convId);
      if (!conv) return prev;
      return [{ ...conv, updatedAt: new Date().toISOString() }, ...prev.filter((c) => c.id !== convId)];
    });
  }

  return (
    <>
      <style>{`
        .cp-root { display: flex; height: 100%; overflow: hidden; }
        .cp-sidebar { width: 260px; flex-shrink: 0; overflow: hidden; }
        .cp-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .cp-error { padding: 0.625rem 1.5rem; font-size: 0.8125rem; color: hsl(0, 72%, 65%); background: hsla(0, 63%, 31%, 0.12); border-bottom: 1px solid hsla(0, 63%, 31%, 0.2); }
      `}</style>
      <div className="cp-root">
        <div className="cp-sidebar">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        </div>

        <div className="cp-main">
          {error && <div className="cp-error">{error}</div>}
          <ChatThread messages={messages} streaming={streaming} />
          <MessageInput onSend={handleSend} disabled={isStreaming} />
        </div>
      </div>
    </>
  );
}
