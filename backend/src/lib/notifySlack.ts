import { NotePayload } from './validate.js';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
    elements?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export async function notifySlack(noteData: NotePayload): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  // Format amount as currency
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(noteData.amount);

  // Get transaction type emoji
  const getTypeEmoji = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'invoice': return '📄';
      case 'expense': return '💸';
      case 'bill': return '🧾';
      case 'payment': return '💳';
      case 'journalentry': return '📝';
      default: return '📋';
    }
  };

  const typeEmoji = getTypeEmoji(noteData.transaction_type);
  
  // Create a more comprehensive message
  const message: SlackMessage = {
    text: `New Transaction Note: ${noteData.transaction_type} - ${formattedAmount}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${typeEmoji} *New Transaction Note Added*`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Transaction Type:*\n${noteData.transaction_type}`
          },
          {
            type: 'mrkdwn',
            text: `*Amount:*\n${formattedAmount}`
          },
          {
            type: 'mrkdwn',
            text: `*${noteData.transaction_type === 'Invoice' ? 'Customer' : 'Vendor/Payee'}:*\n${noteData.customer_vendor || 'Not specified'}`
          },
          {
            type: 'mrkdwn',
            text: `*Date:*\n${noteData.date || 'Not specified'}`
          }
        ]
      }
    ]
  };

  // Add transaction ID if available
  if (noteData.transaction_id) {
    message.blocks!.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Transaction ID:*\n${noteData.transaction_id}`
        },
        {
          type: 'mrkdwn',
          text: `*Created By:*\n${noteData.created_by || 'Unknown'}`
        }
      ]
    });
  }

  // Add the note content
  message.blocks!.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Note:*\n_"${noteData.note}"_`
    }
  });

  // Add action buttons
  message.blocks!.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `<${noteData.transaction_url}|🔗 View in QuickBooks Online>`
    }
  });

  // Add timestamp
  message.blocks!.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `📅 Submitted: ${new Date().toLocaleString('en-US', { 
          timeZone: 'America/New_York',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })}`
      }
    ]
  });

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    throw error;
  }
}