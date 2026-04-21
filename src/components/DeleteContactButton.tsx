'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteContact } from '@/app/actions/contacts';
import { useRouter } from 'next/navigation';

export function DeleteContactButton({ contactId }: { contactId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    setIsDeleting(true);
    try {
      await deleteContact(contactId);
      router.refresh();
    } catch (error) {
       alert('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      aria-label="Delete contact"
    >
      <Trash2 size={16} />
    </button>
  );
}
