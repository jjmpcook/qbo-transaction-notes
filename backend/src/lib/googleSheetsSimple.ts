import { google } from 'googleapis';
import { NoteRecord } from './supabase.js';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'QBO Transaction Notes';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

interface DailyReportData {
  notes: NoteRecord[];
  date: string;
  summary: {
    totalNotes: number;
    totalAmount: number;
    transactionTypes: Record<string, number>;
  };
}

export class GoogleSheetsService {

  /**
   * Check if Google Sheets is properly configured
   */
  static isConfigured(): boolean {
    const hasConfig = !!(SPREADSHEET_ID && GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY);
    if (!hasConfig) {
      console.warn('⚠️  Google Sheets not configured. Missing environment variables.');
    }
    return hasConfig;
  }

  /**
   * Get authenticated Google Sheets client
   */
  static async getClient() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient as any });
  }

  /**
   * Add daily report data to the existing sheet
   */
  static async appendDailyData(reportData: DailyReportData): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('⚠️  Google Sheets not configured, skipping data append');
      return;
    }

    try {
      const sheets = await this.getClient();

      // Format data rows - each transaction gets its own row
      const dataRows = reportData.notes.map(note => [
        reportData.date, // Report date
        new Date(note.created_at).toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        note.transaction_type,
        note.transaction_id || '',
        note.date || '',
        note.amount || 0,
        note.customer_vendor || '',
        (note as any).invoice_number || '',
        note.note,
        note.created_by || '',
        note.status,
        note.transaction_url
      ]);

      // Add a summary row if there are transactions
      if (dataRows.length > 0) {
        dataRows.push([
          reportData.date,
          'DAILY SUMMARY',
          `${reportData.summary.totalNotes} transactions`,
          '',
          '',
          reportData.summary.totalAmount,
          Object.entries(reportData.summary.transactionTypes).map(([type, count]) => `${type}: ${count}`).join(', '),
          '',
          `Daily report for ${reportData.date}`,
          'SYSTEM',
          'SUMMARY',
          ''
        ]);
      }

      // Add headers if this is the first time
      await this.ensureHeaders(sheets);

      // Append the data
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID!,
        range: `${SHEET_NAME}!A:L`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: dataRows,
        },
      });

      console.log(`✅ Added ${reportData.notes.length} transactions to Google Sheet`);
    } catch (error) {
      console.error('❌ Failed to append data to Google Sheet:', error);
      throw error;
    }
  }

  /**
   * Ensure headers exist in the sheet
   */
  static async ensureHeaders(sheets: any): Promise<void> {
    try {
      // Check if sheet has headers
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID!,
        range: `${SHEET_NAME}!A1:L1`,
      });

      // If first row is empty, add headers
      if (!response.data.values || response.data.values.length === 0) {
        const headers = [
          'Report Date',
          'Created At',
          'Transaction Type',
          'Transaction ID',
          'Date',
          'Amount',
          'Customer/Vendor',
          'Invoice/Bill #',
          'Note',
          'Created By',
          'Status',
          'QuickBooks URL'
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID!,
          range: `${SHEET_NAME}!A1:L1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });

        console.log('✅ Added headers to Google Sheet');
      }
    } catch (error) {
      console.error('❌ Error ensuring headers:', error);
    }
  }

  /**
   * Generate and send daily report to existing Google Sheet
   */
  static async generateDailyReport(reportData: DailyReportData): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('⚠️  Google Sheets not configured, skipping daily report');
      return;
    }

    try {
      console.log(`📊 Adding daily report data to Google Sheet for ${reportData.date}...`);

      // Append daily data
      await this.appendDailyData(reportData);

      console.log(`✅ Daily Google Sheets report completed for ${reportData.date}`);
      console.log(`📈 Added: ${reportData.summary.totalNotes} transactions, $${reportData.summary.totalAmount.toFixed(2)} total`);

    } catch (error) {
      console.error('❌ Failed to generate daily Google Sheets report:', error);
      throw error;
    }
  }

  /**
   * Test the Google Sheets connection
   */
  static async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('❌ Google Sheets not configured');
      return false;
    }

    try {
      const sheets = await this.getClient();

      const response = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID!,
      });

      const sheetTitle = response.data.properties?.title;
      console.log(`✅ Google Sheets connection successful! Spreadsheet: "${sheetTitle}"`);
      console.log(`📋 Target sheet: "${SHEET_NAME}"`);
      return true;
    } catch (error) {
      console.error('❌ Google Sheets connection failed:', error);
      return false;
    }
  }
}