'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter }                   from 'next/navigation';
import { motion }                      from 'framer-motion';
import { useTheme }                    from '@/lib/useTheme';

const PHRASES = [
  'your research papers',
  'your legal contracts',
  'your project reports',
  'any uploaded document',
];
const FEATURES = [
  {
    icon: 'ti-adjustments',
    title: 'Finds what you mean',
    desc: 'Searches by both exact words and meaning — so even if you phrase it differently, it still finds the right answer.',
  },
  {
    icon: 'ti-trophy',
    title: 'Double-checks results',
    desc: 'A second AI re-reads the top results before answering, so you always get the most relevant response.',
  },
  {
    icon: 'ti-files',
    title: 'Answers across all your files',
    desc: 'Upload multiple documents and ask questions across all of them. Answers come from whichever document contains the information.',
  },
  {
    icon: 'ti-bookmark',
    title: 'Shows its sources',
    desc: 'Every answer tells you exactly which document and page it came from — so you can verify it yourself.',
  },
  {
    icon: 'ti-file-stack',
    title: 'Works with any file',
    desc: 'Upload PDFs, Word documents, text files, or markdown — ask questions across all of them at once.',
  },
  {
    icon: 'ti-bolt',
    title: 'Answers as they generate',
    desc: 'Responses appear word by word as they are being written — no waiting for a full answer to load.',
  },
];

export default function HeroPage() {
  const router     = useRouter();
  const { dark, toggle } = useTheme();
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isTyping,  setIsTyping]  = useState(true);

  // Typewriter effect
  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    if (isTyping) {
      if (displayed.length < phrase.length) {
        const t = setTimeout(
          () => setDisplayed(phrase.slice(0, displayed.length + 1)),
          55
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setIsTyping(false), 1800);
      return () => clearTimeout(t);
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 28);
        return () => clearTimeout(t);
      }
      setPhraseIdx(i => (i + 1) % PHRASES.length);
      setIsTyping(true);
    }
  }, [displayed, isTyping, phraseIdx]);

  // Canvas particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT       = 75;
    const MAX_DIST    = 130;
    const SPEED       = 0.4;

    const particles = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r:  Math.random() * 1.8 + 0.8,
    }));

    const draw = () => {
      const isDark = document.documentElement.classList.contains('dark');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move and draw dots
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? 'rgba(129,140,248,0.55)'
          : 'rgba(79,70,229,0.35)';
        ctx.fill();
      });

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * (isDark ? 0.25 : 0.18);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(129,140,248,${alpha})`
              : `rgba(79,70,229,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const fade = (delay = 0) => ({
    initial:    { opacity: 0, y: 20 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.25, 0.4, 0.25, 1] as const },
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)',
                       letterSpacing: '-0.5px' }}>
          DocuMind
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="https://github.com/NARMEEN-UROOJ/documind" target="_blank" rel="noreferrer"
            style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none',
                     padding: '6px 12px' }}>
            GitHub
          </a>
          <button onClick={toggle} style={{
            width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-2)', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true" />
          </button>
          <button onClick={() => router.push('/chat')} style={{
            padding: '7px 18px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--accent)', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 600,
          }}>
            Launch app
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <section style={{
        minHeight: '100vh', position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px', textAlign: 'center',
        overflow: 'hidden',
      }}>

        {/* Canvas particle background */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 0,
          }}
        />

        {/* Content above particles */}
        <div style={{
          position: 'relative', zIndex: 1, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>

          {/* Badge */}
          <motion.div {...fade(0.1)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 20, marginBottom: 28,
            background: 'var(--accent-bg)', border: '1px solid var(--border)',
            fontSize: 12, fontWeight: 500, color: 'var(--accent)',
            letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            <i className="ti ti-sparkles" style={{ fontSize: 13 }} aria-hidden="true" />
            Agentic RAG platform
          </motion.div>

          {/* Heading */}
          <motion.h1 {...fade(0.2)} style={{
            fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 700,
            color: 'var(--text)', lineHeight: 1.15,
            margin: '0 0 16px', letterSpacing: '-1.5px', maxWidth: 720,
          }}>
            Ask anything about
            <br />
            <span style={{
  background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}}>
              {displayed}
              <span style={{
                borderRight: '2px solid var(--accent)', marginLeft: 2,
                animation: 'cursor-blink 0.8s step-end infinite',
              }} />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p {...fade(0.35)} style={{
            fontSize: 17, color: 'var(--text-2)', maxWidth: 520,
            lineHeight: 1.6, margin: '0 0 36px',
          }}>
            Upload your documents and get precise, cited answers powered by
            AI that understands meaning, not just keywords.
          </motion.p>

          {/* CTA buttons */}
          <motion.div {...fade(0.45)} style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            justifyContent: 'center', marginBottom: 80,
          }}>
            <button
              onClick={() => router.push('/chat')}
              style={{
                padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--accent)', border: 'none',
                color: '#fff', fontSize: 15, fontWeight: 600,
                transition: 'transform .15s',
              }}
              onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={e  => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Get started
            </button>
            <a href="https://github.com/NARMEEN-UROOJ/documind" target="_blank" rel="noreferrer" style={{
              padding: '12px 28px', borderRadius: 10,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: 15, fontWeight: 500,
              textDecoration: 'none', display: 'inline-flex',
              alignItems: 'center', gap: 6,
            }}>
              <i className="ti ti-brand-github" style={{ fontSize: 16 }} aria-hidden="true" />
              View on GitHub
            </a>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14, maxWidth: 860, width: '100%',
            }}
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.7 + i * 0.07 }}
                style={{
                  padding: '18px 20px', borderRadius: 12, textAlign: 'left',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  transition: 'border-color .2s, transform .2s', cursor: 'default',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                  (e.currentTarget as HTMLElement).style.transform   = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.transform   = 'translateY(0)';
                }}
              >
                <i className={`ti ${f.icon}`}
                   style={{ fontSize: 20, color: 'var(--accent)',
                            marginBottom: 10, display: 'block' }}
                   aria-hidden="true" />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)',
                            margin: '0 0 4px' }}>
                  {f.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0,
                            lineHeight: 1.55 }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>
    </div>
  );
}