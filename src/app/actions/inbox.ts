'use server';

import prisma from '@/lib/db';

export async function getPaginatedConversations({
  cursor,
  limit = 20,
  showAll = false,
  query = '',
}: {
  cursor?: string;
  limit?: number;
  showAll?: boolean;
  query?: string;
}) {
  const where: any = {};

  if (!showAll) {
    where.messages = {
      some: {
        direction: 'INBOUND'
      }
    };
  }

  if (query) {
    where.contact = {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { phoneNumber: { contains: query } }
      ]
    };
  }

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
    take: limit + 1, // Fetch one extra to determine if there's a next page
    cursor: cursor ? { id: cursor } : undefined,
    // If we're using a cursor, we skip the first record because it's the cursor itself
    skip: cursor ? 1 : 0,
  });

  let nextCursor: string | undefined = undefined;
  if (conversations.length > limit) {
    const nextItem = conversations.pop();
    nextCursor = nextItem?.id;
  }

  return {
    conversations,
    nextCursor,
  };
}
