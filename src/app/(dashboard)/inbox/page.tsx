import prisma from '@/lib/db';
import Link from 'next/link';
import { User, CheckCircle2, ChevronLeft } from 'lucide-react';
import { MessageReplyInput } from '@/components/MessageReplyInput';
import { InboxSearch } from '@/components/InboxSearch';
import { BlockContactButton } from '@/components/BlockContactButton';
import { ConversationList } from '@/components/ConversationList';
import { getPaginatedConversations } from '@/app/actions/inbox';

export const dynamic = 'force-dynamic';

export default async function InboxPage({ searchParams }: { searchParams: { chat?: string, q?: string, all?: string } }) {
  const activeChatId = searchParams.chat;
  const query = searchParams.q || '';
  const showAll = searchParams.all === 'true';

  const { conversations: initialConversations, nextCursor } = await getPaginatedConversations({
    limit: 20,
    showAll,
    query,
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
    <div className="flex h-[calc(100vh-theme(spacing.16))] overflow-hidden">
      {/* Sidebar List */}
      <div className={`
        ${activeChatId ? 'hidden md:flex' : 'flex'} 
        w-full md:w-1/3 border-r h-full flex-col bg-white
      `}>
        <div className="p-4 border-b bg-gray-50 shrink-0 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-800">Inbox</h2>
          <div className="flex bg-gray-200 p-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider">
             <Link 
                href={`/inbox?${new URLSearchParams({ ...searchParams, all: 'false' }).toString()}`}
                className={`px-2 py-1 rounded-md transition-all ${!showAll ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                Replies
             </Link>
             <Link 
                href={`/inbox?${new URLSearchParams({ ...searchParams, all: 'true' }).toString()}`}
                className={`px-2 py-1 rounded-md transition-all ${showAll ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                All
             </Link>
          </div>
        </div>
        <InboxSearch />
        <div className="flex-1 overflow-y-auto divide-y relative">
          <ConversationList
             initialConversations={initialConversations as any}
             initialNextCursor={nextCursor}
             activeChatId={activeChatId}
             showAll={showAll}
             query={query}
          />
        </div>
      </div>

      {/* Main Detail Area */}
      <div className={`
        ${!activeChatId ? 'hidden md:flex' : 'flex'} 
        flex-1 flex-col bg-[#e5ddd5]
      `}>
        {activeConversation ? (
          <>
            <div className="p-3 md:p-4 bg-gray-50 border-b flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2 md:gap-3">
                  <Link href="/inbox" className="md:hidden p-1 -ml-1 text-teal-600">
                    <ChevronLeft size={24} />
                  </Link>
                  <div className="bg-gray-200 p-1.5 md:p-2 rounded-full text-gray-600">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{activeConversation.contact.name || 'Unknown Contact'}</h3>
                    <p className="text-xs text-gray-600">{activeConversation.contact.phoneNumber}</p>
                  </div>
               </div>

               <BlockContactButton 
                  contactId={activeConversation.contactId} 
                  phoneNumber={activeConversation.contact.phoneNumber} 
               />
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
