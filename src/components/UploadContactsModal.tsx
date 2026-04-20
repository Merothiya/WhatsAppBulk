'use client';

import { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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

  const processRows = async (rows: any[]) => {
    const payload = rows.map(row => {
      const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('number') || k.toLowerCase().includes('mobile'));
      const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('first'));
      return {
        name: nameKey ? String(row[nameKey]) : 'Unknown',
        phoneNumber: phoneKey ? String(row[phoneKey]) : String(Object.values(row)[0])
      };
    }).filter(r => r.phoneNumber && r.phoneNumber.length > 3);

    const imported = await createContactsBulk(payload);
    alert(`Successfully imported ${imported} contacts!`);
    setIsOpen(false);
    setFile(null);
    router.refresh();
  };

  const handleUpload = () => {
    if (!file) return;
    setLoading(true);

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      // CSV parsing with papaparse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            await processRows(results.data as any[]);
          } catch (err: any) {
            alert(`Error: ${err.message}`);
          } finally {
            setLoading(false);
          }
        },
        error: (error) => {
          alert(`CSV parse error: ${error.message}`);
          setLoading(false);
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      // Excel parsing with xlsx
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
          await processRows(rows);
        } catch (err: any) {
          alert(`Excel parse error: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Unsupported file type. Please upload a .csv, .xlsx, or .xls file.');
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition"
      >
        <UploadCloud size={16} />
        Upload Contacts
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
              <p className="text-sm text-gray-700 mb-4">
                Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file with columns for <strong>Phone Number</strong> (with country code) and optionally <strong>Name</strong>.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <UploadCloud size={32} className="text-gray-400 mb-2" />
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 max-w-xs mx-auto
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-teal-50 file:text-teal-700
                    hover:file:bg-teal-100"
                />
                {file && <p className="text-xs text-gray-600 mt-2">Selected: {file.name}</p>}
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
