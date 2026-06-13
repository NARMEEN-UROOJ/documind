'use client';
import Link         from 'next/link';
import { useTheme } from '@/lib/useTheme';

interface Props {
  docCount:   number;
  onNewChat:  () => void;
}

export default function Navbar({ docCount, onNewChat }: Props) {
  const { dark, toggle } = useTheme();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 30, height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
    }}>
      <Link href="/" style={{
        fontSize: 15, fontWeight: 700, color: 'var(--accent)',
        letterSpacing: '-0.5px', textDecoration: 'none',
      }}>
        DocuMind
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {docCount > 0 && (
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 20,
            background: 'var(--accent-bg)', color: 'var(--accent)',
            border: '1px solid var(--border)', fontWeight: 500,
          }}>
            {docCount} doc{docCount > 1 ? 's' : ''} attached
          </span>
        )}

        {/* New Chat button */}
        <button
          onClick={onNewChat}
          title="Start a new chat session"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-2)', fontSize: 13, fontWeight: 500,
            transition: 'all .15s',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.color       = 'var(--accent)';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLElement).style.color       = 'var(--text-2)';
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
          New chat
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title="Toggle theme"
          style={{
            width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-2)', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color .15s',
          }}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseOut={e  => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}