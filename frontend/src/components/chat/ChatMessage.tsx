import ReactMarkdown from 'react-markdown';
import type { ConversationMessage } from '@/services/api';

interface Props {
  message: ConversationMessage;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'USER';

  return (
    <>
      <style>{`
        .cm-row { display: flex; margin-bottom: 1.25rem; }
        .cm-row.user { justify-content: flex-end; }
        .cm-row.assistant { justify-content: flex-start; }
        .cm-bubble { max-width: 78%; padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.9rem; line-height: 1.6; }
        .cm-bubble.user { background: hsla(38, 95%, 52%, 0.15); border: 1px solid hsla(38, 95%, 52%, 0.25); color: hsl(38, 95%, 80%); border-bottom-right-radius: 4px; }
        .cm-bubble.assistant { background: hsl(224, 65%, 7%); border: 1px solid hsla(213, 31%, 91%, 0.07); color: hsl(213, 31%, 85%); border-bottom-left-radius: 4px; }
        .cm-bubble p { margin: 0 0 0.75em; }
        .cm-bubble p:last-child { margin-bottom: 0; }
        .cm-bubble ul, .cm-bubble ol { margin: 0 0 0.75em 1.25em; padding: 0; }
        .cm-bubble li { margin-bottom: 0.25em; }
        .cm-bubble strong { color: hsl(213, 31%, 95%); font-weight: 600; }
        .cm-bubble code { background: hsla(213, 31%, 91%, 0.08); padding: 2px 5px; border-radius: 4px; font-family: 'DM Mono', monospace; font-size: 0.85em; }
      `}</style>
      <div className={`cm-row ${isUser ? 'user' : 'assistant'}`}>
        <div className={`cm-bubble ${isUser ? 'user' : 'assistant'}`}>
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
      </div>
    </>
  );
}
