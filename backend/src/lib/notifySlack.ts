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
  }>;
}

export async function notifySlack(noteData: NotePayload): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  const message: SlackMessage = {
    text: 'New Transaction Note',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*New Transaction Note*'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Type:* ${noteData.transaction_type}`
          },
          {
            type: 'mrkdwn',
            text: `*Amount:* ${noteData.amount}`
          },
          {
            type: 'mrkdwn',
            text: `*Party:* ${noteData.customer_vendor}`
          },
          {
            type: 'mrkdwn',
            text: `*Date:* ${noteData.date}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Note:* ${noteData.note}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${noteData.transaction_url}|View in QuickBooks>`
        }
      }
    ]
  };

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