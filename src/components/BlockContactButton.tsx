'use client';

import { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { blockContact } from '@/app/actions/contacts';
import { useRouter } from 'next/navigation';

interface BlockContactButtonProps {
  contactId: string;
  phoneNumber: string;
}

export function BlockContactButton({ contactId, phoneNumber }: BlockContactButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBlock = async () => {
    if (!confirm('Are you sure you want to block this contact? This will delete the contact and all its messages, and prevent future imports of this number.')) {
      return;
    }

    setLoading(true);
    try {
      await blockContact(contactId, phoneNumber);
      router.push('/inbox');
      router.refresh();
    } catch (error: any) {
      alert(`Error blocking contact: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1 text-xs font-semibold"
      title="Block and Delete Contact"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
      <span>Block</span>
    </button>
  );
}
