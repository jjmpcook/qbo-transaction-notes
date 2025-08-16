import { NotePayload } from './validate.js';
import { WebClient } from '@slack/web-api';

// DUAL-CHANNEL STRATEGY: Send notifications to multiple parties
// - Primary channel: User's own workspace/channel (full control)
// - Shared channel: Client/accountant workspace (via invitation)
// This approach avoids complex multi-workspace authentication while
// enabling seamless communication between user and external parties

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL; // Primary channel (user's workspace)
const SLACK_SHARED_CHANNEL = process.env.SLACK_SHARED_CHANNEL; // Secondary channel (shared/client workspace)

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
  if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL) {
    console.warn('SLACK_BOT_TOKEN or SLACK_CHANNEL not configured, skipping Slack notification');
    return;
  }

  const slack = new WebClient(SLACK_BOT_TOKEN);

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
  
  // Get dynamic label for invoice/bill number field
  const getNumberFieldLabel = (transactionType: string): string => {
    switch (transactionType.toLowerCase()) {
      case 'invoice':
        return 'Invoice Number';
      case 'expense':
      case 'bill':
        return 'Bill/Ref Number';
      default:
        return 'Number';
    }
  };

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
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*${getNumberFieldLabel(noteData.transaction_type)}:*\n${noteData.invoice_number || 'Not specified'}`
          },
          {
            type: 'mrkdwn',
            text: `*Created By:*\n${noteData.created_by || 'Unknown'}`
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
    // Send to primary channel
    await slack.chat.postMessage({
      channel: SLACK_CHANNEL,
      text: message.text,
      blocks: message.blocks,
    });

    // Send to shared channel if configured
    const SHARED_CHANNEL = process.env.SLACK_SHARED_CHANNEL;
    if (SHARED_CHANNEL) {
      console.log(`Sending to shared channel: ${SHARED_CHANNEL}`);
      try {
        await slack.chat.postMessage({
          channel: SHARED_CHANNEL,
          text: message.text,
          blocks: message.blocks,
        });
        console.log(`✅ Shared channel message sent to ${SHARED_CHANNEL}`);
      } catch (sharedError) {
        console.error(`❌ Failed to send to shared channel ${SHARED_CHANNEL}:`, sharedError);
      }
    }

    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    throw error;
  }
}