'use server';

import prisma from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/meta';

export async function createCampaign(name: string, templateId: string, contactIds: string[]) {
  if (contactIds.length === 0) throw new Error('No contacts selected');

  const batch = await prisma.outboundBatch.create({
    data: {
      name,
      templateId,
      status: 'pending',
      totalRecipients: contactIds.length,
      items: {
        create: contactIds.map((id) => ({
          contactId: id,
          status: 'pending',
        })),
      },
    },
  });

  return batch.id;
}

export async function processBatchChunk(batchId: string, chunkSize: number = 20) {
  // Get pending items for this batch
  const pendingItems = await prisma.outboundBatchItem.findMany({
    where: { batchId, status: 'pending' },
    take: chunkSize,
    include: { contact: true, batch: true },
  });

  if (pendingItems.length === 0) {
    // All done
    await prisma.outboundBatch.update({
      where: { id: batchId },
      data: { status: 'completed' }
    });
    return { remaining: 0, processedInChunk: 0 };
  }

  // Update status to processing temporarily
  await prisma.outboundBatch.update({
    where: { id: batchId },
    data: { status: 'processing' }
  });

  let processed = 0;
  let failed = 0;

  // Process sequentially to avoid rate-limit spikes
  for (const item of pendingItems) {
    try {
      // In a real scenario, template payload is constructed from templateId
      // And we pass variables from `item.variables`
      
      const template = await prisma.template.findUnique({
        where: { metaTemplateId: item.batch.templateId }
      });
      
      const payload = {
        name: template?.name || 'hello_world',
        language: { code: template?.language || 'en_US' }
      };

      const response = await sendWhatsAppMessage(item.contact.phoneNumber, 'template', payload);
      
      const metaMessageId = response.messages?.[0]?.id;

      await prisma.outboundBatchItem.update({
        where: { id: item.id },
        data: {
          status: 'sent',
          metaMessageId: metaMessageId,
          processedAt: new Date(),
        }
      });
      processed++;

      // Upsert Conversation/Message for record keeping
      const conversation = await prisma.conversation.upsert({
        where: { contactId: item.contactId },
        create: { contactId: item.contactId },
        update: { lastMessageAt: new Date() },
      });

      if (metaMessageId) {
        await prisma.message.create({
          data: {
            metaMessageId,
            contactId: item.contactId,
            conversationId: conversation.id,
            direction: 'OUTBOUND',
            type: 'template',
            content: payload,
            status: 'sent',
          }
        });
      }

    } catch (error: any) {
      await prisma.outboundBatchItem.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          processedAt: new Date(),
        }
      });
      failed++;
    }
  }

  // Update batch counts
  await prisma.outboundBatch.update({
    where: { id: batchId },
    data: {
      processedCount: { increment: processed },
      failedCount: { increment: failed },
    }
  });

  // Check how many remain
  const remaining = await prisma.outboundBatchItem.count({
    where: { batchId, status: 'pending' }
  });

  if (remaining === 0) {
    await prisma.outboundBatch.update({
      where: { id: batchId },
      data: { status: 'completed' }
    });
  }

  return { remaining, processedInChunk: processed + failed };
}

export async function fetchLiveTemplates() {
  try {
    console.log('[Sync] Starting template fetch from Meta...');
    const { fetchTemplates } = await import('@/lib/meta');
    const templates = await fetchTemplates();
    
    console.log(`[Sync] Received ${templates.length} templates from Meta API.`);
    
    let synced = 0;

    for (const t of templates) {
      try {
        await prisma.template.upsert({
          where: { metaTemplateId: t.id },
          create: {
            metaTemplateId: t.id,
            name: t.name,
            language: t.language,
            category: t.category,
            status: t.status,
            components: t.components,
            rejectedReason: t.rejected_reason,
          },
          update: {
            status: t.status,
            components: t.components,
            rejectedReason: t.rejected_reason,
            lastSyncedAt: new Date(),
          }
        });
        synced++;
      } catch (upsertError: any) {
        console.error(`[Sync] Failed to upsert template ${t.name}:`, upsertError.message);
      }
    }

    console.log(`[Sync] Successfully synced ${synced}/${templates.length} templates.`);
    return { success: true, count: synced };
  } catch (error: any) {
    console.error('[Sync] Global error in fetchLiveTemplates:', error.message);
    throw new Error(error.message || 'Failed to sync templates with Meta.');
  }
}

