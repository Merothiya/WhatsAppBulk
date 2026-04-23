'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createContactsBulk(contacts: { name: string; phoneNumber: string }[]) {
  if (!contacts || contacts.length === 0) {
    throw new Error('No valid contacts to process.');
  }

  // Clean phone numbers: remove non-numeric characters
  const cleanContacts = contacts.map(c => ({
    name: (c.name || 'Unknown').trim(),
    phoneNumber: c.phoneNumber.replace(/\D/g, '')
  })).filter(c => c.phoneNumber.length > 5);

  if (cleanContacts.length === 0) {
    throw new Error('No valid phone numbers found in the uploaded file.');
  }

  // 1. Get list of blocked numbers
  const blocked = await prisma.blockedContact.findMany({
    select: { phoneNumber: true }
  });
  const blockedSet = new Set(blocked.map(b => b.phoneNumber));

  // 2. Filter out blocked contacts
  const allowedContacts = cleanContacts.filter(c => !blockedSet.has(c.phoneNumber));

  if (allowedContacts.length === 0) return 0;

  let imported = 0;

  // We use standard createMany with skipDuplicates for simplicity
  try {
    const result = await prisma.contact.createMany({
      data: allowedContacts,
      skipDuplicates: true,
    });
    imported = result.count;
    
    revalidatePath('/contacts');
  } catch (error: any) {
    throw new Error(`Bulk import failed: ${error.message}`);
  }

  return imported;
}

export async function deleteContact(id: string) {
  try {
    // Delete in a transaction to handle foreign key constraints
    await prisma.$transaction([
      prisma.outboundBatchItem.deleteMany({ where: { contactId: id } }),
      prisma.message.deleteMany({ where: { contactId: id } }),
      prisma.conversation.deleteMany({ where: { contactId: id } }),
      prisma.contact.delete({ where: { id } }),
    ]);
    revalidatePath('/contacts');
  } catch (error: any) {
    throw new Error(`Failed to delete contact: ${error.message}`);
  }
}

export async function getContacts(limit?: number, skip: number = 0, search?: string) {
  try {
    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive' as const
      }
    } : {};

    return await prisma.contact.findMany({
      where,
      orderBy: [
        { name: 'asc' },
        { createdAt: 'desc' },
        { id: 'asc' }
      ],
      take: limit,
      skip: skip,
    });
  } catch (error: any) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }
}

export async function getContactsCount(search?: string) {
  try {
    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive' as const
      }
    } : {};
    return await prisma.contact.count({ where });
  } catch (error: any) {
    throw new Error(`Failed to count contacts: ${error.message}`);
  }
}

export async function blockContact(contactId: string, phoneNumber: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Add to blocked list
      await tx.blockedContact.upsert({
        where: { phoneNumber },
        update: {},
        create: { phoneNumber }
      });

      // 2. Delete the contact
      // We assume cascading deletes are set or relations are managed
      await tx.contact.delete({
        where: { id: contactId }
      });

      return { success: true };
    });
  } catch (error: any) {
    throw new Error(`Failed to block contact: ${error.message}`);
  }
}
