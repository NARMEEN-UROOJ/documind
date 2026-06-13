'use client';
import { useState }  from 'react';
import { getPdfUrl } from '@/lib/api';
import { Citation }  from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CitationCard({ c, i }: { c: Citation; i: number }) {
  const [hovered, setHovered] = useState(false);

  const name    = c.source.replace(/\.[^.]+$/, '');
  const label   = name.length > 24 ? name.slice(0, 24) + '…' : name;
  const isPdf   = c.source.toLowerCase().endsWith('.pdf');

  // PDFs open inline at the correct page; other files download
  const url = isPdf
    ? getPdfUrl(c.source, c.page_num)
    : `${API}/documents/${encodeURIComponent(c.source)}/view`;

  const icon = isPdf ? 'ti-external-link' : 'ti-download';
  const tip  = isPdf
    ? `Open ${c.source} at page ${c.page_num}`
    : `Download ${c.source}`;

  return (
    <div style={{ position: 'relative', display: 'inline-block',
                  marginRight: 6, marginTop: 4 }}>
      <button
        onClick={() => window.open(url, '_blank')}
        title={tip}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px 3px 6px',
          background: 'var(--accent-bg)', border: '1px solid var(--border)',
          borderRadius: 20, cursor: 'pointer', transition: 'border-color .15s',
        }}
        onMouseOver={e  => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseOut={e   => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <span style={{
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--accent)', color: 'var(--user-text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 600, flexShrink: 0,
        }}>
          {i + 1}
        </span>
        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
          {label}
        </span>
        {c.page_num > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
            p.{c.page_num}
          </span>
        )}
        <i className={`ti ${icon}`}
           style={{ fontSize: 10, color: 'var(--accent)' }}
           aria-hidden="true" />
      </button>

      {/* Snippet tooltip */}
      {hovered && c.snippet && (
        <div style={{
          position: 'absolute', bottom: '120%', left: 0,
          width: 280, padding: '10px 12px', zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, fontSize: 12, color: 'var(--text-2)',
          lineHeight: 1.55, pointerEvents: 'none',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600,
                      color: 'var(--accent)' }}>
            Relevant excerpt
          </p>
          {c.snippet}{c.snippet.length >= 178 ? '…' : ''}
        </div>
      )}
    </div>
  );
}