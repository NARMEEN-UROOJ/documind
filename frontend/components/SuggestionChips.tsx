'use client';

interface Props {
  suggestions: string[];
  onSelect:    (question: string) => void;
}

export default function SuggestionChips({ suggestions, onSelect }: Props) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
        margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        Suggested questions
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {suggestions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            style={{
              padding: '7px 12px', borderRadius: 10, cursor: 'pointer',
              background: 'var(--accent-bg)', border: '1px solid var(--border)',
              color: 'var(--accent)', fontSize: 12, fontWeight: 500,
              textAlign: 'left', transition: 'all .15s', lineHeight: 1.4,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.background    = 'var(--accent)';
              (e.currentTarget as HTMLElement).style.color         = '#fff';
              (e.currentTarget as HTMLElement).style.borderColor   = 'var(--accent)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.background    = 'var(--accent-bg)';
              (e.currentTarget as HTMLElement).style.color         = 'var(--accent)';
              (e.currentTarget as HTMLElement).style.borderColor   = 'var(--border)';
            }}
          >
            <i className="ti ti-chevron-right"
               style={{ fontSize: 11, flexShrink: 0 }}
               aria-hidden="true" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}