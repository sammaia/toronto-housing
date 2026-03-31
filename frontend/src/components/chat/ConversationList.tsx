import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import type { ConversationSummary } from '@/services/api';

interface Props {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function groupByDate(convs: ConversationSummary[]): Record<string, ConversationSummary[]> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const groups: Record<string, ConversationSummary[]> = { Today: [], Yesterday: [], Older: [] };
  convs.forEach((c) => {
    const d = new Date(c.updatedAt);
    if (d >= todayStart) groups['Today'].push(c);
    else if (d >= yesterdayStart) groups['Yesterday'].push(c);
    else groups['Older'].push(c);
  });
  return groups;
}

export function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  const groups = groupByDate(conversations);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .cl-root { display: flex; flex-direction: column; height: 100%; background: hsl(224, 71%, 3%); border-right: 1px solid hsla(213, 31%, 91%, 0.06); }
        .cl-header { padding: 1.25rem 1rem 0.75rem; flex-shrink: 0; }
        .cl-new-btn { width: 100%; display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.875rem; border-radius: 8px; border: 1px solid hsla(38, 95%, 52%, 0.25); background: hsla(38, 95%, 52%, 0.07); color: hsl(38, 95%, 65%); font-size: 0.8125rem; font-weight: 500; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
        .cl-new-btn:hover { background: hsla(38, 95%, 52%, 0.14); border-color: hsla(38, 95%, 52%, 0.4); }
        .cl-list { flex: 1; overflow-y: auto; padding: 0.5rem; }
        .cl-group-label { font-size: 0.65rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: hsl(215, 16%, 38%); padding: 0.75rem 0.5rem 0.375rem; }
        .cl-item { position: relative; display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 0.625rem; border-radius: 7px; cursor: pointer; border: none; background: none; text-align: left; transition: background 0.12s; }
        .cl-item:hover { background: hsla(213, 31%, 91%, 0.05); }
        .cl-item.active { background: hsla(38, 95%, 52%, 0.1); }
        .cl-item-text { flex: 1; overflow: hidden; font-size: 0.8125rem; color: hsl(213, 31%, 75%); white-space: nowrap; text-overflow: ellipsis; }
        .cl-item.active .cl-item-text { color: hsl(38, 95%, 70%); }
        .cl-delete-btn { flex-shrink: 0; display: none; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; color: hsl(215, 16%, 40%); padding: 2px; border-radius: 4px; transition: color 0.12s; }
        .cl-item:hover .cl-delete-btn { display: flex; }
        .cl-delete-btn:hover { color: hsl(0, 72%, 65%); }
        .cl-empty { padding: 2rem 1rem; text-align: center; font-size: 0.8125rem; color: hsl(215, 16%, 38%); }
      `}</style>
      <div className="cl-root">
        <div className="cl-header">
          <button className="cl-new-btn" onClick={onNew}>
            <Plus size={14} />
            New chat
          </button>
        </div>

        <div className="cl-list">
          {conversations.length === 0 && (
            <p className="cl-empty">No conversations yet.<br />Start by asking a question.</p>
          )}
          {Object.entries(groups).map(([label, items]) =>
            items.length === 0 ? null : (
              <div key={label}>
                <p className="cl-group-label">{label}</p>
                {items.map((c) => (
                  <button
                    key={c.id}
                    className={`cl-item${activeId === c.id ? ' active' : ''}`}
                    onClick={() => onSelect(c.id)}
                  >
                    <MessageSquare size={13} style={{ flexShrink: 0, color: 'hsl(215, 16%, 42%)' }} />
                    <span className="cl-item-text">{c.title ?? 'New conversation'}</span>
                    <span
                      className="cl-delete-btn"
                      role="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                    >
                      <Trash2 size={12} />
                    </span>
                  </button>
                ))}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
