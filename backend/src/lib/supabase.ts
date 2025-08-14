import { createClient } from '@supabase/supabase-js';
import { NotePayload } from './validate.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceRoleKey);
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('⚠️  Missing Supabase credentials - notes will not be saved to database');
  console.warn('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.warn('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'SET' : 'NOT SET');
}

export const supabase = supabaseUrl && supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

export interface NoteRecord {
  id: string;
  transaction_url: string;
  transaction_id: string;
  transaction_type: string;
  date: string;
  amount: number;
  customer_vendor: string;
  note: string;
  created_by: string;
  status: string;
  created_at: string;
}

export async function insertNote(noteData: NotePayload): Promise<{ id: string }> {
  if (!supabase) {
    console.log('📝 Test mode - note would be saved:', noteData);
    return { id: 'test-' + Date.now() };
  }

  console.log('💾 Saving note to Supabase:', noteData);

  const { data, error } = await supabase
    .from('notes')
    .insert({
      transaction_url: noteData.transaction_url,
      transaction_id: noteData.transaction_id,
      transaction_type: noteData.transaction_type,
      date: noteData.date,
      amount: noteData.amount,
      customer_vendor: noteData.customer_vendor,
      note: noteData.note,
      created_by: noteData.created_by || '',
      status: 'Open',
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ Supabase insert error:', error);
    throw new Error(`Failed to insert note: ${error.message}`);
  }

  console.log('✅ Note saved successfully with ID:', data.id);
  return { id: data.id };
}