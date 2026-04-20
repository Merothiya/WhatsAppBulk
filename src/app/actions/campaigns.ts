'use server';

import prisma from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/meta';

export async function createCampaign(
  name: string,
  templateId: string,
  contactIds: string[],
  templateVariables?: any
) {
  if (contactIds.length === 0) throw new Error('No contacts selected');

  const batch = await prisma.outboundBatch.create({
    data: {
      name,
      templateId,
      templateVariables: templateVariables || null,
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
  const pendingItems = await prisma.outboundBatchItem.findMany({
    where: { batchId, status: 'pending' },
    take: chunkSize,
    include: { contact: true, batch: true },
  });

  if (pendingItems.length === 0) {
    await prisma.outboundBatch.update({
      where: { id: batchId },
      data: { status: 'completed' }
    });
    return { remaining: 0, processedInChunk: 0 };
  }

  await prisma.outboundBatch.update({
    where: { id: batchId },
    data: { status: 'processing' }
  });

  let processed = 0;
  let failed = 0;

  for (const item of pendingItems) {
    try {
      // FIXED: Use `id` (our internal UUID) instead of `metaTemplateId`
      const template = await prisma.template.findUnique({
        where: { id: item.batch.templateId }
      });

      if (!template) {
        throw new Error(`Template not found for ID: ${item.batch.templateId}`);
      }

      // Build the full Meta API template payload
      const templatePayload: any = {
        name: template.name,
        language: { code: template.language },
      };

      // Add components if user provided variables
      const vars = item.batch.templateVariables as any;
      if (vars) {
        const components: any[] = [];

        // Header component (image/video/document)
        if (vars.headerMediaUrl) {
          const templateComponents = template.components as any[];
          const headerComp = templateComponents?.find((c: any) => c.type === 'HEADER');
          const headerFormat = headerComp?.format?.toLowerCase() || 'image';

          components.push({
            type: 'header',
            parameters: [{
              type: headerFormat,
              [headerFormat]: { link: vars.headerMediaUrl }
            }]
          });
        }

        // Body component (text variables like {{1}}, {{2}})
        if (vars.bodyParams && vars.bodyParams.length > 0) {
          components.push({
            type: 'body',
            parameters: vars.bodyParams.map((val: string) => ({
              type: 'text',
              text: val
            }))
          });
        }

        if (components.length > 0) {
          templatePayload.components = components;
        }
      }

      const response = await sendWhatsAppMessage(item.contact.phoneNumber, 'template', templatePayload);
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
            content: templatePayload,
            status: 'sent',
          }
        });
      }

    } catch (error: any) {
      console.error(`[Campaign] Failed to send to ${item.contact.phoneNumber}:`, error.message);
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

  await prisma.outboundBatch.update({
    where: { id: batchId },
    data: {
      processedCount: { increment: processed },
      failedCount: { increment: failed },
    }
  });

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
