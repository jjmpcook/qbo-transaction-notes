import { NoteRecord } from './supabase.js';

interface CSVExportData {
  notes: NoteRecord[];
  date: string;
  summary: {
    totalNotes: number;
    totalAmount: number;
    transactionTypes: Record<string, number>;
  };
}

export class CSVExportService {

  /**
   * Convert notes data to CSV format
   */
  static generateCSV(exportData: CSVExportData): string {
    // CSV Headers
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

    // Format data rows
    const dataRows = exportData.notes.map(note => [
      exportData.date,
      new Date(note.created_at).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      note.transaction_type || '',
      note.transaction_id || '',
      note.date || '',
      note.amount || 0,
      note.customer_vendor || '',
      (note as any).invoice_number || '',
      note.note || '',
      note.created_by || '',
      note.status || '',
      note.transaction_url || ''
    ]);

    // Add summary rows
    const summaryRows = [
      [], // Empty row
      ['DAILY SUMMARY', '', '', '', '', '', '', '', '', '', '', ''],
      ['Total Transactions', exportData.summary.totalNotes.toString(), '', '', '', '', '', '', '', '', '', ''],
      ['Total Amount', `$${exportData.summary.totalAmount.toFixed(2)}`, '', '', '', '', '', '', '', '', '', ''],
      [], // Empty row
      ['Transaction Types', '', '', '', '', '', '', '', '', '', '', ''],
    ];

    // Add transaction type breakdown
    Object.entries(exportData.summary.transactionTypes).forEach(([type, count]) => {
      summaryRows.push([type, count.toString(), '', '', '', '', '', '', '', '', '', '']);
    });

    // Combine all rows
    const allRows = [headers, ...dataRows, ...summaryRows];

    // Convert to CSV format
    return allRows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(date: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `qbo-transactions-${date || timestamp}.csv`;
  }

  /**
   * Generate CSV with proper headers for download
   */
  static generateDownloadResponse(exportData: CSVExportData) {
    const csv = this.generateCSV(exportData);
    const filename = this.generateFilename(exportData.date);

    return {
      content: csv,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
      filename,
    };
  }

  /**
   * Log export summary
   */
  static logExportSummary(exportData: CSVExportData): void {
    console.log(`📊 CSV Export Summary for ${exportData.date}:`);
    console.log(`   • Total Transactions: ${exportData.summary.totalNotes}`);
    console.log(`   • Total Amount: $${exportData.summary.totalAmount.toFixed(2)}`);
    console.log(`   • Transaction Types:`, exportData.summary.transactionTypes);
    console.log(`   • Filename: ${this.generateFilename(exportData.date)}`);
  }
}