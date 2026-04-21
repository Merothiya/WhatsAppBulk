import prisma from '@/lib/db';
import { SyncTemplatesButton } from '@/components/SyncTemplatesButton';

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: { lastSyncedAt: 'desc' }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Message Templates</h2>
        <SyncTemplatesButton />
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-6 text-sm font-medium text-gray-900">Name</th>
              <th className="py-3 px-6 text-sm font-medium text-gray-900">Category</th>
              <th className="py-3 px-6 text-sm font-medium text-gray-900">Language</th>
              <th className="py-3 px-6 text-sm font-medium text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="border-b last:border-none">
                <td className="py-3 px-6 text-black">{t.name}</td>
                <td className="py-3 px-6 text-black">{t.category}</td>
                <td className="py-3 px-6 text-black">{t.language}</td>
                <td className="py-3 px-6 ">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    t.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    t.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-black">
                  No templates synced yet. Click &quot;Sync from Meta&quot; to fetch templates.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
