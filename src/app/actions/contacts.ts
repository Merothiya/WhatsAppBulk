'use server';

import prisma from '@/lib/db';

export async function createContactsBulk(contacts: { name: string; phoneNumber: string }[]) {
  if (!contacts || contacts.length === 0) {
    throw new Error('No valid contacts to process.');
  }

  // Clean phone numbers: remove non-numeric characters
  const cleanContacts = contacts.map(c => ({
    name: c.name || 'Unknown',
    phoneNumber: c.phoneNumber.replace(/\D/g, '')
  })).filter(c => c.phoneNumber.length > 5);

  if (cleanContacts.length === 0) {
    throw new Error('No valid phone numbers found in the uploaded file.');
  }

  let imported = 0;

  // We use standard createMany with skipDuplicates for simplicity
  try {
    const result = await prisma.contact.createMany({
      data: cleanContacts,
      skipDuplicates: true, // Requires unique constraint on phoneNumber (which exists)
    });
    imported = result.count;
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
  } catch (error: any) {
    throw new Error(`Failed to delete contact: ${error.message}`);
  }
}
