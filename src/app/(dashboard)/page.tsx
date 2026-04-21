import prisma from '@/lib/db';
import { Users, Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import MediaUpload from '@/components/MediaUpload';

export default async function DashboardOverview() {
  const [
    totalContacts,
    inboundMessages,
    outboundSent,
    delivered,
    read,
    failed
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.message.count({ where: { direction: 'INBOUND' } }),
    prisma.message.count({ where: { direction: 'OUTBOUND' } }),
    prisma.message.count({ where: { direction: 'OUTBOUND', status: 'delivered' } }),
    prisma.message.count({ where: { direction: 'OUTBOUND', status: 'read' } }),
    prisma.message.count({ where: { direction: 'OUTBOUND', status: 'failed' } }),
  ]);

  const cards = [
    { title: 'Total Contacts', value: totalContacts, icon: Users, color: 'text-blue-600' },
    { title: 'Inbound Messages', value: inboundMessages, icon: MessageSquare, color: 'text-purple-600' },
    { title: 'Outbound Sent', value: outboundSent, icon: Send, color: 'text-teal-600' },
    { title: 'Delivered', value: delivered, icon: CheckCircle2, color: 'text-green-600' },
    { title: 'Failed', value: failed, icon: AlertCircle, color: 'text-red-600' },
    { title: 'Estimated Spend', value: `₹${outboundSent}`, icon: Send, color: 'text-indigo-600' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <h3 className="text-3xl font-bold text-gray-800">{card.value}</h3>
              </div>
              <div className={`p-4 rounded-full bg-gray-50 ${card.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl p-8 text-white shadow-lg">
        <h3 className="text-xl font-bold mb-2">Ready for bulk sending</h3>
        <p className="opacity-90 max-w-2xl">
          Your WhatsApp Business connection is active. Visit the Campaigns tab to start a new batch using approved templates.
        </p>
      </div>

      <div className="mt-8">
         <h2 className="text-2xl font-bold text-gray-800 mb-6">Tools</h2>
         <MediaUpload />
      </div>
    </div>
  );
}
