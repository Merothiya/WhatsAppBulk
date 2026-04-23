import prisma from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Send, IndianRupee, MessageSquare } from 'lucide-react';
import { BatchRunner } from '@/components/BatchRunner';

export const dynamic = 'force-dynamic';

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const batch = await prisma.outboundBatch.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          contact: true
        },
        orderBy: { processedAt: 'desc' }
      }
    }
  });

  if (!batch) {
    return (
      <div className="p-8 text-center text-gray-700">
        <p>Campaign not found.</p>
        <Link href="/campaigns" className="text-teal-600 underline mt-2 inline-block">Back to Campaigns</Link>
      </div>
    );
  }

  const template = await prisma.template.findUnique({ where: { id: batch.templateId } });

  const sentCount = batch.items.filter(i => i.status === 'sent').length;
  const failedCount = batch.items.filter(i => i.status === 'failed').length;
  const pendingCount = batch.items.filter(i => i.status === 'pending').length;
  const remaining = batch.totalRecipients - batch.processedCount - batch.failedCount;
  const progress = batch.totalRecipients === 0 ? 0 : Math.round(((sentCount + failedCount) / batch.totalRecipients) * 100);

  // Fetch conversations for contacts in this campaign
  const contactIds = batch.items.map(item => item.contactId);
  const conversations = await prisma.conversation.findMany({
    where: { contactId: { in: contactIds } },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { lastMessageAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/campaigns" className="text-gray-600 hover:text-gray-800 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{batch.name}</h2>
          <p className="text-sm text-gray-600">
            Template: <span className="font-medium">{template?.name || 'Unknown'}</span> &middot; 
            Created {new Date(batch.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`ml-auto px-3 py-1 text-sm font-semibold rounded-full ${
          batch.status === 'completed' ? 'bg-green-100 text-green-700' :
          batch.status === 'processing' ? 'bg-blue-100 text-blue-700' :
          batch.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {batch.status.toUpperCase()}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <Send size={18} className="text-teal-600" />
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl font-bold text-gray-800">{batch.totalRecipients}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-600" />
          <div>
            <p className="text-xs text-gray-600">Sent</p>
            <p className="text-xl font-bold text-gray-800">{sentCount}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <XCircle size={18} className="text-red-600" />
          <div>
            <p className="text-xs text-gray-600">Failed</p>
            <p className="text-xl font-bold text-gray-800">{failedCount}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <Clock size={18} className="text-yellow-600" />
          <div>
            <p className="text-xs text-gray-600">Pending</p>
            <p className="text-xl font-bold text-gray-800">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <IndianRupee size={18} className="text-indigo-600" />
          <div>
            <p className="text-xs text-gray-600">Est. Cost</p>
            <p className="text-xl font-bold text-gray-800">{'\u20B9'}{sentCount}</p>
          </div>
        </div>
      </div>

      {/* Progress + Runner */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div className="bg-teal-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        {remaining > 0 && (
          <BatchRunner batchId={batch.id} remaining={remaining} total={batch.totalRecipients} />
        )}
      </div>

      {/* Two columns: Recipients Table + Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipients Table */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800">Recipients ({batch.items.length})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="py-2 px-4 text-gray-700 font-medium">Contact</th>
                  <th className="py-2 px-4 text-gray-700 font-medium">Status</th>
                  <th className="py-2 px-4 text-gray-700 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batch.items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <div className="font-medium text-gray-800">{item.contact.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-600">{item.contact.phoneNumber}</div>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        item.status === 'sent' ? 'bg-green-100 text-green-700' :
                        item.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-xs text-red-600 max-w-[200px] truncate">
                      {item.errorMessage || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversations from this campaign */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <MessageSquare size={16} className="text-teal-600" />
            <h3 className="font-bold text-gray-800">Conversations ({conversations.length})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-600 text-sm">
                No conversations yet from this campaign. Messages will appear here once contacts reply.
              </div>
            ) : (
              conversations.map(conv => (
                <Link 
                  key={conv.id} 
                  href={`/inbox?chat=${conv.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-gray-800">
                      {conv.contact.name || conv.contact.phoneNumber}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">
                    {(() => {
                      const msg = conv.messages[0];
                      if (!msg) return 'No messages';
                      const content = msg.content as any;
                      if (msg.direction === 'OUTBOUND') {
                        return `[Template] ${content?.name || 'Sent'}`;
                      }
                      if (msg.type === 'text') return content?.text?.body || 'Text message';
                      return `[${msg.type}]`;
                    })()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
