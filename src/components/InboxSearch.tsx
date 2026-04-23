'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function InboxSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      router.push(`/inbox?${params.toString()}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, router, searchParams]);

  return (
    <div className="px-4 py-2 bg-white border-b relative">
      <div className="relative group">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-teal-500">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats..."
          className="w-full pl-10 pr-10 py-2 bg-gray-100 border-transparent border focus:bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-lg text-sm outline-none transition-all"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
