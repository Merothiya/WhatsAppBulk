import prisma from '@/lib/db';
import Link from 'next/link';
import { CreateCampaignModal } from '@/components/CreateCampaignModal';
import { DeleteCampaignButton } from '@/components/DeleteCampaignButton';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const [batches, templates] = await Promise.all([
    prisma.outboundBatch.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.template.findMany({ where: { status: 'APPROVED' } }),
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Campaigns</h2>
        <CreateCampaignModal templates={templates} />
      </div>

      <div className="grid gap-4">
        {batches.map(batch => {
          const progress = batch.totalRecipients === 0 ? 0 : Math.round(((batch.processedCount + batch.failedCount) / batch.totalRecipients) * 100);
          return (
            <Link key={batch.id} href={`/campaigns/${batch.id}`} className="block bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition group relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{batch.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      batch.status === 'completed' ? 'bg-green-100 text-green-700' :
                      batch.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      batch.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <span>{batch.totalRecipients} recipients</span>
                    <span>{batch.processedCount} sent</span>
                    {batch.failedCount > 0 && <span className="text-red-600">{batch.failedCount} failed</span>}
                    <span className="text-indigo-600 font-medium">{'\u20B9'}{batch.processedCount} est.</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                    <div className="bg-teal-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
                <div className="flex items-center ml-4">
                  {batch.status === 'pending' && <DeleteCampaignButton batchId={batch.id} />}
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-teal-600 transition ml-2" />
                </div>
              </div>
            </Link>
          );
        })}
        {batches.length === 0 && (
          <div className="text-gray-700 py-10 text-center border-2 border-dashed rounded-lg">
            No campaigns yet. Create one to start batch sending!
          </div>
        )}
      </div>
    </div>
  );
}
