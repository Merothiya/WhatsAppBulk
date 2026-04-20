import prisma from '@/lib/db';

export default async function InboxPage() {
  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      <div className="w-1/3 border-r h-full overflow-y-auto bg-white">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-lg">Inbox</h2>
        </div>
        <div className="divide-y">
          {conversations.map(conv => (
            <div key={conv.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm">{conv.contact.name || conv.contact.phoneNumber}</span>
                <span className="text-xs text-gray-500">
                  {new Date(conv.lastMessageAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {(() => {
                  const msg = conv.messages[0];
                  if (!msg) return 'No messages';
                  
                  const content = msg.content as any;
                  if (msg.direction === 'OUTBOUND') {
                    if (msg.type === 'template') return `[Template] ${content?.name || 'Sent'}`;
                    if (msg.type === 'text') return content?.text?.body || content?.text || 'Text Sent';
                    return `[${msg.type} Sent]`;
                  } else {
                    if (msg.type === 'text') return content?.text?.body || 'Text message';
                    if (msg.type === 'button') return `[Button Option: ${content?.button?.text}]`;
                    if (msg.type === 'interactive') return `[Interactive Response]`;
                    return `[${msg.type} Received]`;
                  }
                })()}
              </p>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No conversations yet.
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p>Select a conversation to view messages</p>
        </div>
      </div>
    </div>
  );
}
