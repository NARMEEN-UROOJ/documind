const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'default';
  let id = sessionStorage.getItem('dm-session-id');
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('dm-session-id', id);
  }
  return id;
}

export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/documents/upload`, {
    method:  'POST',
    headers: { 'x-session-id': getSessionId() },
    body:    form,
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Upload failed'); }
  return res.json();
}

export async function deleteDocument(filename: string) {
  await fetch(`${API}/documents/${encodeURIComponent(filename)}`, {
    method:  'DELETE',
    headers: { 'x-session-id': getSessionId() },
  });
}

export async function clearSession() {
  await fetch(`${API}/documents/clear-session`, {
    method:  'DELETE',
    headers: { 'x-session-id': getSessionId() },
  });
  sessionStorage.removeItem('dm-session-id');
  sessionStorage.removeItem('dm-active-chat');
}

export function getPdfUrl(filename: string, page: number): string {
  return `${API}/documents/${encodeURIComponent(filename)}/view#page=${page}`;
}

export async function* streamChat(
  question: string,
  history:  { role: string; content: string }[]
) {
  const res = await fetch(`${API}/chat/stream`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      question,
      chat_history: history,
      session_id:   getSessionId(),
    }),
  });

  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      if (line.startsWith('data: ')) {
        try { yield JSON.parse(line.slice(6)); } catch {}
      }
    }
  }
}

export type { Citation, Message, UploadedDoc, Conversation } from './types';