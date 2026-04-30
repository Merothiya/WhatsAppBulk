'use client';

import { useState } from 'react';
import { retryFailedItems } from '@/app/actions/campaigns';
import { RotateCcw } from 'lucide-react';

export function RetryButton({ batchId, failedCount }: { batchId: string, failedCount: number }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (failedCount === 0) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    try {
      await retryFailedItems(batchId);
    } catch (err: any) {
      setError(err.message || 'Failed to retry');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
      >
        <RotateCcw size={16} className={isRetrying ? 'animate-spin' : ''} />
        {isRetrying ? 'Retrying...' : `Retry ${failedCount} Failed`}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
