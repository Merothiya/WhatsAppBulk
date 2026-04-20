'use client';

import { useState } from 'react';
import { processBatchChunk } from '@/app/actions/campaigns';

export function BatchRunner({ batchId, remaining, total }: { batchId: string, remaining: number, total: number }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentRemaining, setCurrentRemaining] = useState(remaining);
  const [processed, setProcessed] = useState(total - remaining);

  const runBatchChunk = async () => {
    if (currentRemaining <= 0) return;
    setIsRunning(true);
    
    try {
      const result = await processBatchChunk(batchId, 20); // 20 items per chunk
      setCurrentRemaining(result.remaining);
      setProcessed(prev => prev + result.processedInChunk);

      if (result.remaining > 0) {
        // Continue immediately (or add a slight delay to avoid rate limit)
        setTimeout(runBatchChunk, 1000);
      } else {
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Batch error', error);
      setIsRunning(false);
    }
  };

  const progress = total === 0 ? 0 : Math.round((processed / total) * 100);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm mt-4">
      <h3 className="font-semibold text-gray-700">Campaign Runner</h3>
      <div className="mt-2 text-sm text-gray-500">
        Processed {processed} / {total} ({currentRemaining} remaining)
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3 mb-4">
        <div className="bg-teal-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      {currentRemaining > 0 ? (
        <button
          onClick={runBatchChunk}
          disabled={isRunning}
          className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm cursor-pointer disabled:opacity-50"
        >
          {isRunning ? 'Processing in background...' : 'Resume Batch Sending'}
        </button>
      ) : (
        <span className="text-green-600 font-medium text-sm">Campaign Completed!</span>
      )}
    </div>
  );
}
