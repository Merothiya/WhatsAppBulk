import prisma from '@/lib/db';
import { BatchRunner } from '@/components/BatchRunner';
import { CreateCampaignModal } from '@/components/CreateCampaignModal';

export default async function CampaignsPage() {
  const [batches, templates, contacts] = await Promise.all([
    prisma.outboundBatch.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.template.findMany({ where: { status: 'APPROVED' } }),
    prisma.contact.findMany({ orderBy: { createdAt: 'desc' } })
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Campaigns</h2>
        <CreateCampaignModal templates={templates} contacts={contacts} />
      </div>

      <div className="grid gap-6">
        {batches.map(batch => {
          const remaining = batch.totalRecipients - batch.processedCount - batch.failedCount;
          return (
            <div key={batch.id} className="bg-white border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold">{batch.name}</h3>
              <p className="text-sm text-gray-700 mt-1">Status: {batch.status}</p>
              
              <BatchRunner batchId={batch.id} remaining={remaining} total={batch.totalRecipients} />
            </div>
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
