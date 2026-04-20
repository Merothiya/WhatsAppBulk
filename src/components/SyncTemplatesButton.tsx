'use client';

import { useState } from 'react';
import { fetchLiveTemplates } from '@/app/actions/campaigns';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SyncTemplatesButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await fetchLiveTemplates();
      console.log('Sync result:', result);
      router.refresh();
    } catch (e: any) {
      console.error('Sync error:', e);
      alert(`Failed to sync templates: ${e.message || 'Unknown error'}. Check Vercel Logs for details.`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50"
    >
      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Syncing...' : 'Sync from Meta'}
    </button>
  );
}
