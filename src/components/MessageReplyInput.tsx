'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { sendDirectMessage } from '@/app/actions/messages';

interface MessageReplyInputProps {
  conversationId: string;
  contactId: string;
  phoneNumber: string;
}

export function MessageReplyInput({ conversationId, contactId, phoneNumber }: MessageReplyInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      await sendDirectMessage(conversationId, contactId, phoneNumber, text);
      setText('');
    } catch (error: any) {
      alert(`Error sending message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 border-t shrink-0">
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none text-gray-800"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
}
