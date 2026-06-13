'use client';
import { useState, useEffect } from 'react';

const STEPS = [
  "Searching your documents...",
  "Reranking results...",
  "Generating answer...",
];

export default function ThinkingBubble() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1600);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '10px 14px',
      background: 'var(--ai-bubble)',
      borderRadius: '18px 18px 18px 4px',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 0.18, 0.36].map((d, i) => (
          <span key={i} style={{
            display: 'block', width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)',
            opacity: 0.6,
            animation: `dot-bounce 1.1s ease-in-out ${d}s infinite`,
          }} />
        ))}
      </div>
      <span style={{
        fontSize: 12, color: 'var(--text-2)',
        transition: 'opacity .3s',
      }}>
        {STEPS[step]}
      </span>
    </div>
  );
}