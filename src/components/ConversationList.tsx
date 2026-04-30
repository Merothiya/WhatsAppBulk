'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getPaginatedConversations } from '@/app/actions/inbox';

interface Conversation {
  id: string;
  lastMessageAt: Date;
  contact: {
    id: string;
    phoneNumber: string;
    name: string | null;
  };
  messages: any[];
}

interface ConversationListProps {
  initialConversations: Conversation[];
  initialNextCursor?: string;
  activeChatId?: string;
  showAll: boolean;
  query: string;
}

export function ConversationList({
  initialConversations,
  initialNextCursor,
  activeChatId,
  showAll,
  query,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingIndicatorRef = useRef<HTMLDivElement | null>(null);

  // Reset state when filters change
  useEffect(() => {
    setConversations(initialConversations);
    setNextCursor(initialNextCursor);
  }, [initialConversations, initialNextCursor, showAll, query]);

  const loadMore = useCallback(async () => {
    if (loading || !nextCursor) return;

    setLoading(true);
    try {
      const result = await getPaginatedConversations({
        cursor: nextCursor,
        limit: 20,
        showAll,
        query,
      });

      setConversations((prev) => [...prev, ...result.conversations]);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('Failed to load more conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, nextCursor, showAll, query]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextCursor && !loading) {
        loadMore();
      }
    }, options);

    if (loadingIndicatorRef.current) {
      observerRef.current.observe(loadingIndicatorRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, nextCursor, loading]);

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-700 text-sm">
        No conversations yet.
      </div>
    );
  }

  return (
    <>
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/inbox?chat=${conv.id}${showAll ? '&all=true' : ''}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
          className={`block p-4 transition-colors ${
            activeChatId === conv.id ? 'bg-teal-50 border-l-4 border-teal-500' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="font-semibold text-sm text-gray-800">
              {conv.contact.name || conv.contact.phoneNumber}
            </span>
            <span className="text-xs text-gray-700">
              {new Date(conv.lastMessageAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700 truncate">
            {(() => {
              const msg = conv.messages[0];
              if (!msg) return 'No messages';

              const content = msg.content as any;
              if (msg.direction === 'OUTBOUND') {
                if (msg.type === 'template') return `[Template] ${content?.name || 'Sent'}`;
                if (msg.type === 'text') return content?.body || content?.text?.body || content?.text || 'Text Sent';
                return `[${msg.type} Sent]`;
              } else {
                if (msg.type === 'text') return content?.text?.body || 'Text message';
                if (msg.type === 'button') return `[Button Option: ${content?.button?.text}]`;
                if (msg.type === 'interactive') return `[Interactive Response]`;
                return `[${msg.type} Received]`;
              }
            })()}
          </p>
        </Link>
      ))}
      
      {/* Loading Indicator / Observer Target */}
      {nextCursor && (
        <div ref={loadingIndicatorRef} className="py-4 text-center text-sm text-gray-500">
          {loading ? 'Loading more...' : 'Scroll for more'}
        </div>
      )}
    </>
  );
}
