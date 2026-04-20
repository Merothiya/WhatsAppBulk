import prisma from '@/lib/db';
import { UploadContactsModal } from '@/components/UploadContactsModal';

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Contacts</h2>
        <UploadContactsModal />
      </div>

      <div className="bg-white border text-gray-700 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-6 text-sm font-medium text-gray-700">Phone Number</th>
              <th className="py-3 px-6 text-sm font-medium text-gray-700">Name</th>
              <th className="py-3 px-6 text-sm font-medium text-gray-700">Added</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id} className="border-b last:border-none hover:bg-gray-50">
                <td className="py-3 px-6 font-medium">{c.phoneNumber}</td>
                <td className="py-3 px-6">{c.name || 'Unknown'}</td>
                <td className="py-3 px-6 text-sm text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={3} className="py-10 text-center text-gray-600">
                  No contacts found. Use the upload button to import via CSV.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
