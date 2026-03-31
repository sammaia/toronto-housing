import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ConversationMessage } from '@/services/api';
import { ChatMessage } from './ChatMessage';
import { ToolCallIndicator } from './ToolCallIndicator';

interface StreamingState {
  content: string;
  activeTools: string[];
}

interface Props {
  messages: ConversationMessage[];
  streaming: StreamingState | null;
}

function ThinkingDots() {
  return (
    <>
      <style>{`
        @keyframes td-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-4px); opacity: 1; } }
        .td-wrap { display: flex; align-items: center; gap: 4px; padding: 0.75rem 1rem; }
        .td-dot { width: 6px; height: 6px; border-radius: 50%; background: hsl(215, 16%, 50%); animation: td-bounce 1.2s ease-in-out infinite; }
        .td-dot:nth-child(2) { animation-delay: 0.15s; }
        .td-dot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>
      <div className="td-wrap">
        <span className="td-dot" /><span className="td-dot" /><span className="td-dot" />
      </div>
    </>
  );
}

export function ChatThread({ messages, streaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming?.content, streaming?.activeTools.length]);

  const showThinking = streaming !== null && streaming.content === '' && streaming.activeTools.length === 0;
  const showStreamingBubble = streaming !== null && (streaming.content !== '' || streaming.activeTools.length > 0);

  return (
    <>
      <style>{`
        .ct-root { flex: 1; overflow-y: auto; padding: 1.5rem; }
        .ct-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 0.75rem; color: hsl(215, 16%, 42%); text-align: center; }
        .ct-empty-icon { font-size: 2rem; opacity: 0.4; }
        .ct-empty-title { font-family: 'Fraunces', Georgia, serif; font-weight: 200; font-size: 1.5rem; color: hsl(213, 31%, 65%); }
        .ct-empty-sub { font-size: 0.875rem; max-width: 280px; line-height: 1.5; }
        .ct-streaming-bubble { display: flex; margin-bottom: 1.25rem; }
        .ct-streaming-inner { max-width: 78%; padding: 0.75rem 1rem; border-radius: 12px; border-bottom-left-radius: 4px; font-size: 0.9rem; line-height: 1.6; background: hsl(224, 65%, 7%); border: 1px solid hsla(213, 31%, 91%, 0.07); color: hsl(213, 31%, 85%); }
        .ct-streaming-inner p { margin: 0 0 0.75em; }
        .ct-streaming-inner p:last-child { margin-bottom: 0; }
        .ct-cursor { display: inline-block; width: 2px; height: 1em; background: hsl(38, 95%, 55%); margin-left: 2px; vertical-align: text-bottom; animation: blink 0.9s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
      <div className="ct-root">
        {messages.length === 0 && !streaming && (
          <div className="ct-empty">
            <div className="ct-empty-icon">💬</div>
            <h2 className="ct-empty-title">Ask about Toronto housing</h2>
            <p className="ct-empty-sub">
              Ask anything about vacancy rates, rents, home prices, or market trends. I'll look up the real data.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {showThinking && (
          <div className="ct-streaming-bubble">
            <div className="ct-streaming-inner">
              <ThinkingDots />
            </div>
          </div>
        )}

        {showStreamingBubble && (
          <div className="ct-streaming-bubble">
            <div className="ct-streaming-inner">
              <ToolCallIndicator tools={streaming!.activeTools} />
              {streaming!.content && (
                <ReactMarkdown>{streaming!.content}</ReactMarkdown>
              )}
              {streaming!.activeTools.length === 0 && streaming!.content && (
                <span className="ct-cursor" />
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </>
  );
}
