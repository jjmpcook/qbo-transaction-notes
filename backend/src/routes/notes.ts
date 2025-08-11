import { Router } from 'express';
import { validateNotePayload } from '../lib/validate.js';
import { insertNote } from '../lib/supabase.js';
import { notifySlack } from '../lib/notifySlack.js';

const router = Router();

router.post('/notes', async (req, res) => {
  try {
    const validation = validateNotePayload(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error
      });
    }

    const noteData = validation.data;

    const result = await insertNote(noteData);

    try {
      await notifySlack(noteData);
    } catch (slackError) {
      console.error('Slack notification failed:', slackError);
    }

    res.status(201).json({
      id: result.id,
      success: true
    });

  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;