import prisma from '@/lib/db';
import Link from 'next/link';
import { User, CheckCircle2 } from 'lucide-react';
import { MessageReplyInput } from '@/components/MessageReplyInput';
import { InboxSearch } from '@/components/InboxSearch';

export const dynamic = 'force-dynamic';

export default async function InboxPage({ searchParams }: { searchParams: { chat?: string, q?: string } }) {
  const activeChatId = searchParams.chat;
  const query = searchParams.q;

  const where = query ? {
    contact: {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { phoneNumber: { contains: query } }
      ]
    }
  } : {};

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  });

  const activeConversation = activeChatId ? await prisma.conversation.findUnique({
    where: { id: activeChatId },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  }) : null;

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      {/* Sidebar List */}
      <div className="w-1/3 border-r h-full flex flex-col bg-white">
        <div className="p-4 border-b bg-gray-50 shrink-0">
          <h2 className="font-bold text-lg text-gray-800">Inbox</h2>
        </div>
        <InboxSearch />
        <div className="flex-1 overflow-y-auto divide-y">
          {conversations.map(conv => (
            <Link 
              key={conv.id} 
              href={`/inbox?chat=${conv.id}`}
              className={`block p-4 transition-colors ${activeChatId === conv.id ? 'bg-teal-50 border-l-4 border-teal-500' : 'hover:bg-gray-50'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm text-gray-800">{conv.contact.name || conv.contact.phoneNumber}</span>
                <span className="text-xs text-gray-700">
                  {new Date(conv.lastMessageAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 truncate">
                {(() => {
                  const msg = conv.messages[0];
                  if (!msg) return 'No messages';
                  
                  const content = msg.content as any;
                  if (msg.direction === 'OUTBOUND') {
                    if (msg.type === 'template') return `[Template] ${content?.name || 'Sent'}`;
                    if (msg.type === 'text') return content?.body || content?.text?.body || content?.text || 'Text Sent';
                    return `[${msg.type} Sent]`;
                  } else {
                    if (msg.type === 'text') return content?.text?.body || 'Text message';
                    if (msg.type === 'button') return `[Button Option: ${content?.button?.text}]`;
                    if (msg.type === 'interactive') return `[Interactive Response]`;
                    return `[${msg.type} Received]`;
                  }
                })()}
              </p>
            </Link>
          ))}
          {conversations.length === 0 && (
            <div className="p-8 text-center text-gray-700 text-sm">
              No conversations yet.
            </div>
          )}
        </div>
      </div>

      {/* Main Detail Area */}
      <div className="flex-1 flex flex-col bg-[#e5ddd5]">
        {activeConversation ? (
          <>
            <div className="p-4 bg-gray-50 border-b flex items-center gap-3 shrink-0">
              <div className="bg-gray-200 p-2 rounded-full text-gray-600">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{activeConversation.contact.name || 'Unknown Contact'}</h3>
                <p className="text-xs text-gray-600">{activeConversation.contact.phoneNumber}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeConversation.messages.map((msg) => {
                const isOutbound = msg.direction === 'OUTBOUND';
                const content = msg.content as any;
                
                return (
                  <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 shadow-sm ${isOutbound ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                      {msg.type === 'template' && (
                        <div className="text-sm text-gray-800 flex flex-col gap-1">
                          <span className="font-semibold text-xs opacity-50 uppercase">[Template: {content?.name}]</span>
                          <span>The template was sent.</span>
                        </div>
                      )}
                      
                      {msg.type === 'text' && (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {content?.body || content?.text?.body || content?.text || 'Text Message'}
                        </p>
                      )}

                      {msg.type === 'button' && (
                        <div className="text-sm text-gray-800 flex flex-col gap-1">
                          <span className="font-semibold text-xs opacity-50 uppercase">[Interactive Button]</span>
                          <span>{content?.button?.text || 'Selected option'}</span>
                        </div>
                      )}

                      {msg.type !== 'text' && msg.type !== 'template' && msg.type !== 'button' && (
                        <p className="text-sm text-gray-800 italic opacity-75">
                          Unsupported message type: {msg.type}
                        </p>
                      )}
                      
                      <div className="text-[10px] text-gray-500 mt-1 mt-2 flex justify-end items-center gap-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isOutbound && (
                          <CheckCircle2 size={12} className={msg.status === 'read' ? 'text-blue-500' : 'text-gray-400'} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <MessageReplyInput 
              conversationId={activeConversation.id} 
              contactId={activeConversation.contactId}
              phoneNumber={activeConversation.contact.phoneNumber}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/80 px-4 py-2 rounded-full text-gray-600 shadow-sm">
              Select a conversation to view messages
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
