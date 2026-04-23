import { z } from 'zod';

// We just validate the top level to assure it's a WhatsApp webhook
export const WhatsAppWebhookSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.literal('whatsapp'),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            contacts: z.array(
              z.object({
                profile: z.object({
                  name: z.string(),
                }).optional(),
                wa_id: z.string(),
              }).passthrough()
            ).optional(),
            messages: z.array(z.any()).optional(),
            statuses: z.array(z.any()).optional(),
          }),
          field: z.literal('messages'),
        })
      ),
    })
  ),
});
