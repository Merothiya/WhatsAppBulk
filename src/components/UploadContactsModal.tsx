'use client';

import { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import Papa from 'papaparse';
import { createContactsBulk } from '@/app/actions/contacts';
import { useRouter } from 'next/navigation';

export function UploadContactsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          
          // Try to intelligently find name and phone columns
          const payload = data.map(row => {
             // Look for commonly used keys for phone
             const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('number') || k.toLowerCase().includes('mobile'));
             // Look for commonly used keys for name
             const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('first'));
             
             return {
               name: nameKey ? row[nameKey] : 'Unknown',
               phoneNumber: phoneKey ? row[phoneKey] : Object.values(row)[0] // Fallback to first column if no headers match typical phone naming
             };
          });

          const imported = await createContactsBulk(payload);
          alert(`Successfully imported ${imported} contacts!`);
          setIsOpen(false);
          setFile(null);
          router.refresh();
        } catch (err: any) {
          alert(`Error uploading contacts: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
        setLoading(false);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition"
      >
        <UploadCloud size={16} />
        Upload CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Upload Contacts</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Please upload a CSV file containing your contacts. It must include a column for the <strong>Phone Number</strong> (including country code) and optionally a <strong>Name</strong> column.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <UploadCloud size={32} className="text-gray-400 mb-2" />
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 max-w-xs mx-auto
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-teal-50 file:text-teal-700
                    hover:file:bg-teal-100"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={!file || loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
