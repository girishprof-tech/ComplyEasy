import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { scopedApi, type BusinessScope } from '@/api';
import type { ChatMessage, ChatResponse } from '@/types';

type DisplayMessage = ChatMessage & { sources?: ChatResponse['sources']; demoMode?: boolean };

/**
 * The floating "Ask Venture" chat panel. Scope is decided by the caller (an
 * owner's own business, or the client an accountant has open); conversation
 * history lives here and is sent with each request.
 */
export function AskVenture({ scope }: { scope: BusinessScope }) {
  const api = useMemo(() => scopedApi(scope), [scope]);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text }]);
    setSending(true);
    try {
      const res = await api.chat(text, history);
      setMessages((m) => [...m, { role: 'assistant', text: res.reply, sources: res.sources, demoMode: res.demoMode }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Something went wrong reaching the assistant. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const launcher = (
    <button type="button" className="ask-venture-fab" onClick={() => setOpen(true)} aria-label="Open Ask Venture chat">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      </svg>
      Ask Venture
    </button>
  );

  const panel = (
    <div className="ask-venture-panel" role="dialog" aria-label="Ask Venture">
      <div className="ask-venture-head">
        <span>Ask Venture</span>
        <button type="button" className="btn-ghost btn" onClick={() => setOpen(false)} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="ask-venture-messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="ask-venture-intro">
            <p>Ask about compliance status, potential government schemes, or sustainability ideas for this business.</p>
            <p className="form-note">
              Ask Venture summarizes your own records — it doesn't give legal, tax, or financial advice.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ask-venture-msg ${m.role}`}>
            <div className="ask-venture-bubble">
              {m.text}
              {m.demoMode && (
                <div className="demo-badge" style={{ marginTop: 6 }}>
                  Demo AI Mode
                </div>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="ask-venture-sources">
                  {m.sources.map((s, j) => (
                    <a key={j} href={s.url} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="ask-venture-msg assistant">
            <div className="ask-venture-bubble">
              <span className="spinner" /> Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="ask-venture-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          rows={1}
        />
        <button type="button" className="btn btn-primary" onClick={send} disabled={sending || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );

  return createPortal(open ? panel : launcher, document.body);
}
