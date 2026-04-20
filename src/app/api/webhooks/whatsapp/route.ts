import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { WhatsAppWebhookSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-hub-signature-256');
    const rawBody = await req.text();

    const appSecret = process.env.META_APP_SECRET;
    if (appSecret && signature) {
      const expectedSignature = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
      if (signature !== expectedSignature) {
        return new NextResponse('Invalid signature', { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Basic validation
    const parsed = WhatsAppWebhookSchema.safeParse(payload);
    if (!parsed.success) {
      return new NextResponse('Invalid payload', { status: 400 });
    }

    // Process Entries
    for (const entry of parsed.data.entry) {
      const eventId = entry.id; // Usually WABA id
      const changes = entry.changes[0].value;
      
      // Save Raw Event
      await prisma.webhookEvent.create({
        data: {
          metaEventId: crypto.randomUUID(), // Just saving everything securely
          payload: payload,
          processed: true,
        }
      });

      // Handle Contacts and Messages
      if (changes.contacts && changes.messages) {
        const contactInfo = changes.contacts[0];
        const messageInfo = changes.messages[0];

        // Upsert Contact
        const contact = await prisma.contact.upsert({
          where: { phoneNumber: contactInfo.wa_id },
          create: { phoneNumber: contactInfo.wa_id, name: contactInfo.profile.name },
          update: { name: contactInfo.profile.name },
        });

        // Upsert Conversation
        const conversation = await prisma.conversation.upsert({
          where: { contactId: contact.id },
          create: { contactId: contact.id },
          update: { lastMessageAt: new Date() },
        });

        // Save Message
        await prisma.message.create({
          data: {
            metaMessageId: messageInfo.id,
            conversationId: conversation.id,
            contactId: contact.id,
            direction: 'INBOUND',
            type: messageInfo.type,
            content: messageInfo,
            status: 'received',
          }
        });
      }

      // Handle Status Updates (Delivery, Read, Failed)
      if (changes.statuses) {
        const statusUpdates = changes.statuses;
        for (const statusUpdate of statusUpdates) {
          const { id: wamid, status, recipient_id } = statusUpdate;

          // Update Message
          await prisma.message.updateMany({
            where: { metaMessageId: wamid },
            data: { status },
          });

          // Update BatchItem if part of campaign
          await prisma.outboundBatchItem.updateMany({
            where: { metaMessageId: wamid },
            data: { status: status === 'failed' ? 'failed' : 'sent', errorMessage: statusUpdate.errors ? JSON.stringify(statusUpdate.errors) : null },
          });
        }
      }
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
