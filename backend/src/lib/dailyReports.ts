import { supabase, NoteRecord } from './supabase.js';
import { GoogleSheetsService } from './googleSheetsSimple.js';
import { FileStorage } from './fileStorage.js';

interface DailyReportSummary {
  totalNotes: number;
  totalAmount: number;
  transactionTypes: Record<string, number>;
}

interface DailyReportData {
  notes: NoteRecord[];
  date: string;
  summary: DailyReportSummary;
}

export class DailyReportsService {

  /**
   * Get transactions for a specific date range
   */
  static async getTransactionsForDate(date: string): Promise<NoteRecord[]> {
    // Try Supabase first
    if (supabase) {
      try {
        // Parse the date and get start/end of day in UTC
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
          .order('created_at', { ascending: true });

        if (!error && data) {
          console.log(`📊 Found ${data.length} transactions from database for ${date}`);
          return data as NoteRecord[];
        }

        console.log('📝 Database query failed, falling back to file storage');
      } catch (error) {
        console.log('📝 Database connection failed, falling back to file storage');
      }
    }

    // Fall back to file storage
    try {
      const fileData = await FileStorage.getTransactionsForDate(date);
      console.log(`📊 Found ${fileData.length} transactions from file storage for ${date}`);
      return fileData as NoteRecord[];
    } catch (error) {
      console.error('❌ Both database and file storage failed for date:', date, error);
      return [];
    }
  }

  /**
   * Get transactions for yesterday (useful for daily reports)
   */
  static async getYesterdayTransactions(): Promise<NoteRecord[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format

    return this.getTransactionsForDate(dateString);
  }

  /**
   * Generate summary statistics for transactions
   */
  static generateSummary(notes: NoteRecord[]): DailyReportSummary {
    const summary: DailyReportSummary = {
      totalNotes: notes.length,
      totalAmount: 0,
      transactionTypes: {},
    };

    notes.forEach(note => {
      // Sum amounts
      summary.totalAmount += note.amount || 0;

      // Count transaction types
      const type = note.transaction_type || 'Unknown';
      summary.transactionTypes[type] = (summary.transactionTypes[type] || 0) + 1;
    });

    return summary;
  }

  /**
   * Generate daily report data
   */
  static async generateDailyReportData(date?: string): Promise<DailyReportData> {
    // Use provided date or yesterday
    const reportDate = date || (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    })();

    console.log(`📊 Generating daily report for: ${reportDate}`);

    const notes = await this.getTransactionsForDate(reportDate);
    const summary = this.generateSummary(notes);

    return {
      notes,
      date: reportDate,
      summary,
    };
  }

  /**
   * Send daily report to Google Sheets
   */
  static async sendDailyReport(date?: string): Promise<void> {
    try {
      console.log('🚀 Starting daily report generation...');

      const reportData = await this.generateDailyReportData(date);

      console.log(`📈 Daily Report Summary for ${reportData.date}:`);
      console.log(`   • Total Transactions: ${reportData.summary.totalNotes}`);
      console.log(`   • Total Amount: $${reportData.summary.totalAmount.toFixed(2)}`);
      console.log(`   • Transaction Types:`, reportData.summary.transactionTypes);

      // Send to Google Sheets
      await GoogleSheetsService.generateDailyReport(reportData);

      console.log('✅ Daily report completed successfully');
    } catch (error) {
      console.error('❌ Daily report failed:', error);
      throw error;
    }
  }

  /**
   * Test the daily report system
   */
  static async testDailyReport(): Promise<void> {
    console.log('🧪 Testing daily report system...');

    // Test Google Sheets connection first
    const isConnected = await GoogleSheetsService.testConnection();
    if (!isConnected) {
      throw new Error('Google Sheets connection failed');
    }

    // Generate a test report for today (or yesterday if no data today)
    const today = new Date().toISOString().split('T')[0];
    let reportData = await this.generateDailyReportData(today);

    // If no data today, try yesterday
    if (reportData.notes.length === 0) {
      console.log('No data for today, trying yesterday...');
      reportData = await this.generateDailyReportData();
    }

    if (reportData.notes.length === 0) {
      console.log('⚠️  No transaction data found for testing');
      console.log('Creating a test report with sample data...');

      // Create sample data for testing
      reportData = {
        date: today,
        notes: [],
        summary: {
          totalNotes: 0,
          totalAmount: 0,
          transactionTypes: {},
        },
      };
    }

    await GoogleSheetsService.generateDailyReport(reportData);
    console.log('✅ Daily report test completed');
  }
}