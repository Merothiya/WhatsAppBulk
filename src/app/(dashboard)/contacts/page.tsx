import prisma from '@/lib/db';
import { UploadContactsModal } from '@/components/UploadContactsModal';
import { DeleteContactButton } from '@/components/DeleteContactButton';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ContactsPage({ 
  searchParams 
}: { 
  searchParams: { page?: string; sort?: string } 
}) {
  const currentPage = parseInt(searchParams.page || '1');
  const sortType = searchParams.sort || 'name'; // Default to alphabetical
  const pageSize = 50;
  const skip = (currentPage - 1) * pageSize;

  // Determine sort order
  const orderBy: any = sortType === 'date' 
    ? [{ createdAt: 'desc' }, { id: 'asc' }]
    : [{ name: 'asc' }, { id: 'asc' }];

  const [contacts, totalCount] = await Promise.all([
    prisma.contact.findMany({
      orderBy,
      skip: skip,
      take: pageSize
    }),
    prisma.contact.count()
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Contacts ({totalCount})</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center bg-gray-100 p-1 rounded-md border text-xs font-medium">
              <Link 
                href={`/contacts?page=1&sort=name`}
                className={`px-3 py-1 rounded-md transition ${sortType === 'name' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                A-Z
              </Link>
              <Link 
                href={`/contacts?page=1&sort=date`}
                className={`px-3 py-1 rounded-md transition ${sortType === 'date' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Newest
              </Link>
            </div>
          </div>
        </div>
        <UploadContactsModal />
      </div>

      <div className="bg-white border text-gray-700 rounded-lg shadow-sm overflow-hidden mb-6">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-6 text-sm font-medium text-gray-900">Phone Number</th>
              <th className="py-3 px-6 text-sm font-medium text-gray-900">Name</th>
              <th className="py-3 px-6 text-sm font-medium text-gray-900">Added</th>
              <th className="py-3 px-6 text-sm font-medium text-gray-900 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id} className="border-b last:border-none hover:bg-gray-50">
                <td className="py-3 px-6 font-medium text-gray-900">{c.phoneNumber}</td>
                <td className="py-3 px-6 text-gray-800">{c.name || 'Unknown'}</td>
                <td className="py-3 px-6 text-sm text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-6 text-right">
                  <DeleteContactButton contactId={c.id} />
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gray-600">
                  No contacts found in this page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Link
            href={`/contacts?page=${currentPage - 1}&sort=${sortType}`}
            className={`flex items-center gap-1 px-4 py-2 border rounded-md transition ${currentPage <= 1 ? 'pointer-events-none opacity-30' : 'hover:bg-gray-100'}`}
          >
            <ChevronLeft size={16} />
            Prev
          </Link>
          <span className="text-sm font-medium text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <Link
            href={`/contacts?page=${currentPage + 1}&sort=${sortType}`}
            className={`flex items-center gap-1 px-4 py-2 border rounded-md transition ${currentPage >= totalPages ? 'pointer-events-none opacity-30' : 'hover:bg-gray-100'}`}
          >
            Next
            <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
