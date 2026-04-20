'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createCampaign } from '@/app/actions/campaigns';
import { useRouter } from 'next/navigation';

export function CreateCampaignModal({ 
  templates, 
  contacts 
}: { 
  templates: any[], 
  contacts: any[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const selectedContactIds = formData.getAll('contactIds') as string[];

    if (selectedContactIds.length === 0) {
      alert('Please select at least one contact.');
      setLoading(false);
      return;
    }

    try {
      await createCampaign(
        formData.get('name') as string,
        formData.get('templateId') as string,
        selectedContactIds
      );
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(`Failed to create campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
      >
        New Campaign
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Create New Campaign</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input 
                    required 
                    name="name" 
                    type="text" 
                    placeholder="e.g., Summer Promo" 
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                  <select 
                    required 
                    name="templateId" 
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="">-- Choose an approved template --</option>
                    {templates.filter(t => t.status === 'APPROVED').map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Contacts</label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50 space-y-2">
                    {contacts.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No contacts available.</p>
                    ) : (
                      contacts.map(c => (
                        <label key={c.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded">
                          <input type="checkbox" name="contactIds" value={c.id} className="rounded text-teal-600 focus:ring-teal-500" />
                          <span className="text-sm text-gray-800">{c.name || 'Unknown'} ({c.phoneNumber})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
