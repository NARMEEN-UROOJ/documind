'use client';
import { useState }    from 'react';
import Navbar          from '@/components/Navbar';
import ChatInterface   from '@/components/ChatInterface';
import { clearSession } from '@/lib/api';
import { UploadedDoc }  from '@/lib/types';

export default function ChatPage() {
  const [docCount, setDocCount] = useState(0);
  const [chatKey,  setChatKey]  = useState(0);

  async function handleNewChat() {
    try {
      await clearSession();
    } catch {}
    sessionStorage.removeItem('dm-active-chat');
    setDocCount(0);
    setChatKey(k => k + 1);
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
    }}>
      <Navbar
        docCount={docCount}
        onNewChat={handleNewChat}
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatInterface
          key={chatKey}
          onDocUploaded={(doc: UploadedDoc) => setDocCount(c => c + 1)}
        />
      </div>
    </div>
  );
}