'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCampaign } from '@/app/actions/campaigns';
import { useRouter } from 'next/navigation';

export function DeleteCampaignButton({ batchId }: { batchId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the link since this button is inside a <Link>
    
    if (!confirm('Are you sure you want to delete this pending campaign? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await deleteCampaign(batchId);
      router.refresh(); // Refresh the list
    } catch (error: any) {
      alert(error.message || 'Failed to delete campaign');
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`ml-4 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors z-10 relative ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      aria-label="Delete campaign"
      title="Delete pending campaign"
    >
      <Trash2 size={16} />
    </button>
  );
}
