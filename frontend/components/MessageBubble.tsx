'use client';
import { useState }      from 'react';
import ReactMarkdown      from 'react-markdown';
import remarkGfm          from 'remark-gfm';
import CitationCard       from './CitationCard';
import ThinkingBubble     from './ThinkingBubble';
import SuggestionChips    from './SuggestionChips';
import { Message }        from '@/lib/types';
import { getPdfUrl }      from '@/lib/api';

interface Props {
  msg:                 Message;
  onSuggestionSelect?: (question: string) => void;
}

export default function MessageBubble({ msg, onSuggestionSelect }: Props) {

  // ── Attachment card ────────────────────────────────────────────
  if (msg.role === 'attachment' && msg.attachment) {
    const { filename, pages, chunks, summary, suggestions } = msg.attachment;
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    const API   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url   = isPdf
      ? getPdfUrl(filename, 1)
      : `${API}/documents/${encodeURIComponent(filename)}/view`;
    const icon  = isPdf ? 'ti-external-link' : 'ti-download';
    const tip   = isPdf ? `Open ${filename}` : `Download ${filename}`;

    return (
      <div className="msg-in" style={{ marginBottom: 16 }}>

        {/* File card */}
        <div
          onClick={() => window.open(url, '_blank')}
          title={tip}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 12, maxWidth: 400,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            cursor: 'pointer', transition: 'border-color .15s, transform .15s',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.transform   = 'translateY(-1px)';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLElement).style.transform   = 'translateY(0)';
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 8, flexShrink: 0,
            background: 'var(--accent-bg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-file-text"
               style={{ fontSize: 18, color: 'var(--accent)' }}
               aria-hidden="true" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text)',
              margin: '0 0 3px', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280,
            }}>
              {filename}
            </p>
            <p style={{
              fontSize: 11, color: 'var(--text-3)', margin: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Attached · {pages} page{pages !== 1 ? 's' : ''} · {chunks} chunks
              <i className={`ti ${icon}`}
                 style={{ fontSize: 10, color: 'var(--accent)' }}
                 aria-hidden="true" />
            </p>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <p style={{
            fontSize: 12, color: 'var(--text-2)', margin: '8px 0 0',
            maxWidth: 420, lineHeight: 1.6, fontStyle: 'italic',
          }}>
            {summary}
          </p>
        )}

        {/* Suggested questions */}
        {suggestions && suggestions.length > 0 && onSuggestionSelect && (
          <div style={{ maxWidth: 440 }}>
            <SuggestionChips suggestions={suggestions} onSelect={onSuggestionSelect} />
          </div>
        )}
      </div>
    );
  }

  // ── Chat bubble ────────────────────────────────────────────────
  const human = msg.role === 'human';
  const [copied,  setCopied]  = useState(false);
  const [hovered, setHovered] = useState(false);

  const unique = msg.sources
    ? msg.sources.filter((s, i, a) =>
        a.findIndex(x => x.source === s.source && x.page_num === s.page_num) === i
      )
    : [];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="msg-in" style={{
      display: 'flex',
      justifyContent: human ? 'flex-end' : 'flex-start',
      marginBottom: 16,
    }}>
      <div style={{ maxWidth: '78%', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          flexDirection: human ? 'row-reverse' : 'row',
        }}>

          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600,
            background: human ? 'var(--accent)' : 'var(--bg-elevated)',
            color:      human ? '#fff'           : 'var(--text-2)',
            border:     human ? 'none'           : '1px solid var(--border)',
          }}>
            {human ? 'U' : 'AI'}
          </div>

          {/* Bubble */}
          {msg.isThinking ? (
            <ThinkingBubble />
          ) : (
            <div
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{ position: 'relative' }}
            >
              <div style={{
                padding: '10px 14px', fontSize: 14, lineHeight: 1.65,
                background: human ? 'var(--user-bubble)' : 'var(--ai-bubble)',
                color:      human ? 'var(--user-text)'   : 'var(--ai-text)',
                borderRadius: human ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                border:     human ? 'none' : '1px solid var(--border)',
                borderLeft: human ? undefined : '2px solid var(--accent)',
              }}>
                {human ? (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                ) : (
                  <div className="ai-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noreferrer">{children}</a>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                    {msg.isStreaming && msg.content && (
                      <span style={{
                        display: 'inline-block', width: 2, height: 14,
                        background: 'var(--accent)', marginLeft: 2,
                        verticalAlign: 'text-bottom',
                        animation: 'cursor-blink 0.8s step-end infinite',
                      }} />
                    )}
                  </div>
                )}
              </div>

              {/* Copy button — AI messages only, shows on hover */}
              {!human && !msg.isStreaming && hovered && msg.content && (
                <button
                  onClick={handleCopy}
                  title={copied ? 'Copied!' : 'Copy response'}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 26, height: 26, borderRadius: 6,
                    background: copied ? 'var(--accent)' : 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}
                >
                  <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`}
                     style={{ fontSize: 12, color: copied ? '#fff' : 'var(--text-2)' }}
                     aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Citations */}
        {unique.length > 0 && (
          <div style={{ marginTop: 6, marginLeft: 36, display: 'flex', flexWrap: 'wrap' }}>
            {unique.map((c, i) => <CitationCard key={i} c={c} i={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}