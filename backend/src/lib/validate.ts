import { z } from 'zod';

export const NotePayloadSchema = z.object({
  transaction_url: z.string().url(),
  transaction_id: z.string(),
  transaction_type: z.string(),
  date: z.string(),
  amount: z.number(),
  customer_vendor: z.string(),
  invoice_number: z.string().optional().default(''),
  note: z.string().min(1, 'Note cannot be empty'),
  created_by: z.string().optional().default(''),
});

export type NotePayload = z.infer<typeof NotePayloadSchema>;

export function validateNotePayload(data: unknown): { success: true; data: NotePayload } | { success: false; error: string } {
  try {
    const validated = NotePayloadSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Invalid payload format' };
  }
}