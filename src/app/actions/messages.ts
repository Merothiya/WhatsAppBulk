'use server';

import prisma from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/meta';
import { revalidatePath } from 'next/cache';

export async function sendDirectMessage(conversationId: string, contactId: string, phoneNumber: string, text: string) {
  if (!text.trim()) return;

  try {
    // 1. Send to Meta
    const response = await sendWhatsAppMessage(phoneNumber, 'text', { body: text.trim() });
    const metaMessageId = response.messages?.[0]?.id;

    if (!metaMessageId) {
      throw new Error('Failed to get message ID from Meta');
    }

    // 2. Save to database
    await prisma.$transaction([
      prisma.message.create({
        data: {
          metaMessageId,
          contactId,
          conversationId,
          direction: 'OUTBOUND',
          type: 'text',
          content: { body: text.trim() },
          status: 'sent',
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      })
    ]);

    revalidatePath('/inbox');
    return { success: true };
  } catch (error: any) {
    console.error('[Action] sendDirectMessage failed:', error.message);
    throw new Error(error.message || 'Failed to send message');
  }
}
