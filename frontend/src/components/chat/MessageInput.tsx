import { useState, useRef, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (content: string) => void;
  disabled: boolean;
}

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }

  return (
    <>
      <style>{`
        .mi-root { padding: 1rem 1.5rem 1.25rem; border-top: 1px solid hsla(213, 31%, 91%, 0.07); flex-shrink: 0; }
        .mi-wrap { display: flex; align-items: flex-end; gap: 0.75rem; background: hsl(224, 65%, 6%); border: 1px solid hsl(216, 34%, 16%); border-radius: 12px; padding: 0.625rem 0.875rem; transition: border-color 0.2s, box-shadow 0.2s; }
        .mi-wrap:focus-within { border-color: hsl(38, 95%, 52%); box-shadow: 0 0 0 3px hsla(38, 95%, 52%, 0.1); }
        .mi-textarea { flex: 1; background: none; border: none; outline: none; resize: none; font-size: 0.9375rem; color: hsl(213, 31%, 88%); line-height: 1.5; min-height: 24px; max-height: 180px; padding: 0; font-family: inherit; }
        .mi-textarea::placeholder { color: hsl(215, 16%, 32%); }
        .mi-textarea:disabled { cursor: not-allowed; opacity: 0.5; }
        .mi-send { flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s, transform 0.1s; }
        .mi-send:enabled { background: hsl(38, 95%, 52%); }
        .mi-send:enabled:hover { background: hsl(38, 95%, 58%); transform: scale(1.05); }
        .mi-send:disabled { background: hsl(216, 34%, 17%); cursor: not-allowed; }
        .mi-hint { margin-top: 0.5rem; font-size: 0.7rem; color: hsl(215, 16%, 35%); text-align: right; letter-spacing: 0.03em; }
      `}</style>
      <div className="mi-root">
        <div className="mi-wrap">
          <textarea
            ref={textareaRef}
            className="mi-textarea"
            placeholder="Ask about Toronto housing data…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={disabled}
            rows={1}
          />
          <button
            className="mi-send"
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
          >
            <Send
              size={15}
              style={{ color: disabled || !value.trim() ? 'hsl(215,16%,45%)' : 'hsl(224,71%,8%)' }}
            />
          </button>
        </div>
        <p className="mi-hint">⌘ Enter to send</p>
      </div>
    </>
  );
}
