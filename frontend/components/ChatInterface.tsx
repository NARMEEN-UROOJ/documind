'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { streamChat, uploadDocument }                from '@/lib/api';
import { Message, UploadedDoc }                      from '@/lib/types';
import MessageBubble                                  from './MessageBubble';
import toast                                          from 'react-hot-toast';

const CACHE_KEY = 'dm-active-chat';

interface Props {
  initialMessages?: Message[];
  onDocUploaded:    (doc: UploadedDoc) => void;
}

export default function ChatInterface(
  { initialMessages = [], onDocUploaded }: Props
) {
  const [messages,     setMessages]     = useState<Message[]>(initialMessages);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  // Restore from session cache on first mount
  useEffect(() => {
    if (initialMessages.length === 0) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const msgs  = JSON.parse(cached) as Message[];
          const clean = msgs.map(m => ({
            ...m, isStreaming: false, isThinking: false,
          }));
          if (clean.length > 0) {
            setMessages(clean);
            if (clean.some(m => m.role === 'attachment')) setHasDocuments(true);
          }
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to session cache on every message change
  useEffect(() => {
    if (messages.length > 0) {
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(messages)); } catch {}
    }
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || loading || !hasDocuments) return;
    setLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(), role: 'human', content: question,
    };
    const aiId    = (Date.now() + 1).toString();
    const thinkMsg: Message = {
      id: aiId, role: 'assistant', content: '',
      isStreaming: true, isThinking: true,
    };

    setMessages(p => [...p, userMsg, thinkMsg]);

    const history = messages
      .filter(m => m.role === 'human' || m.role === 'assistant')
      .map(m => ({ role: m.role as string, content: m.content }));

    try {
      let firstToken = true;
      for await (const ev of streamChat(question, history)) {
        if (ev.type === 'token') {
          if (firstToken) {
            firstToken = false;
            setMessages(p => p.map(m =>
              m.id === aiId
                ? { ...m, isThinking: false, content: ev.content }
                : m
            ));
          } else {
            setMessages(p => p.map(m =>
              m.id === aiId ? { ...m, content: m.content + ev.content } : m
            ));
          }
        } else if (ev.type === 'sources') {
          setMessages(p => p.map(m =>
            m.id === aiId
              ? { ...m, sources: ev.content, isStreaming: false, isThinking: false }
              : m
          ));
        } else if (ev.type === 'done') {
          setMessages(p => p.map(m =>
            m.id === aiId ? { ...m, isStreaming: false, isThinking: false } : m
          ));
        }
      }
    } catch {
      setMessages(p => p.map(m =>
        m.id === aiId
          ? { ...m, content: 'Something went wrong. Please try again.',
              isStreaming: false, isThinking: false }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }, [loading, hasDocuments, messages]);

  async function handleFileSelect(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const doc = await uploadDocument(file);

      const attachMsg: Message = {
        id:   Date.now().toString(),
        role: 'attachment',
        content: '',
        attachment: {
          filename:    doc.filename,
          pages:       doc.pages,
          chunks:      doc.chunks,
          summary:     doc.summary,
          suggestions: doc.suggestions,
        },
      };

      setMessages(p => [...p, attachMsg]);
      setHasDocuments(true);
      onDocUploaded(doc);
      toast.success(`${doc.filename} — ${doc.chunks} chunks ready`);
    } catch (e: any) {
      toast.error(e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleSend() {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.txt,.md,.docx"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
      />

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px' }}>

          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 80 }}>
              <i className="ti ti-file-upload"
                 style={{ fontSize: 40, display: 'block', marginBottom: 14,
                          color: 'var(--text-3)' }}
                 aria-hidden="true" />
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)',
                          margin: '0 0 8px' }}>
                Attach a document to get started
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 20px' }}>
                Upload a PDF, Word doc, text file, or markdown file below.
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
                  background: 'var(--accent)', border: 'none',
                  color: '#fff', fontSize: 14, fontWeight: 500,
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? 'Uploading…' : 'Upload document'}
              </button>
            </div>
          ) : (
            messages.map(m => (
              <MessageBubble
                key={m.id}
                msg={m}
                onSuggestionSelect={q => {
                  sendMessage(q);
                }}
              />
            ))
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: 'var(--bg-input)', borderRadius: 14,
            border: '1px solid var(--border)', padding: '8px 10px',
          }}>

            {/* Paperclip */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Attach document"
              style={{
                width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                background: uploading ? 'var(--accent-bg)' : 'var(--bg-elevated)',
                border: '1px solid var(--border)', flexShrink: 0,
                color: uploading ? 'var(--accent)' : 'var(--text-2)',
                fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color .15s',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseOut={e  => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <i className={`ti ${uploading ? 'ti-loader-2' : 'ti-paperclip'}`}
                 aria-hidden="true" />
            </button>

            {/* Text input */}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault(); handleSend();
                }
              }}
              disabled={loading}
              placeholder={
                hasDocuments
                  ? 'Ask anything about your documents…'
                  : 'Attach a document first…'
              }
              rows={1}
              style={{
                flex: 1, resize: 'none', background: 'none',
                border: 'none', outline: 'none', fontSize: 14,
                color: 'var(--text)', lineHeight: 1.5,
                maxHeight: 120, overflowY: 'auto',
                opacity: loading ? 0.5 : 1,
              }}
            />

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !hasDocuments}
              style={{
                width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                background: 'var(--accent)', border: 'none', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (loading || !input.trim() || !hasDocuments) ? 0.35 : 1,
                transition: 'opacity .15s',
              }}
            >
              <i className="ti ti-arrow-up"
                 style={{ fontSize: 16, color: '#fff' }}
                 aria-hidden="true" />
            </button>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center',
                      marginTop: 8 }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}