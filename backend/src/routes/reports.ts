import { Router } from 'express';
import { DailyReportsService } from '../lib/dailyReports.js';
import { ReportScheduler } from '../lib/scheduler.js';
import { GoogleSheetsService } from '../lib/googleSheetsSimple.js';
import { CSVExportService } from '../lib/csvExport.js';

const router = Router();

/**
 * GET /reports/test
 * Test the Google Sheets connection and daily report system
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing daily report system via API...');

    await DailyReportsService.testDailyReport();

    res.json({
      success: true,
      message: 'Daily report system test completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Daily report test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Daily report test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /reports/manual
 * Trigger a manual daily report
 */
router.post('/manual', async (req, res) => {
  try {
    const { date } = req.body; // Optional date in YYYY-MM-DD format

    console.log('🔄 Manual daily report requested via API...');

    await ReportScheduler.triggerManualReport(date);

    res.json({
      success: true,
      message: `Manual daily report completed${date ? ` for ${date}` : ''}`,
      date: date || 'yesterday',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Manual daily report failed:', error);
    res.status(500).json({
      success: false,
      error: 'Manual daily report failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /reports/status
 * Get scheduler status and configuration
 */
router.get('/status', (req, res) => {
  const status = ReportScheduler.getStatus();
  const isGoogleSheetsConfigured = GoogleSheetsService.isConfigured();

  res.json({
    success: true,
    scheduler: status,
    googleSheets: {
      configured: isGoogleSheetsConfigured,
      spreadsheetId: process.env.GOOGLE_SHEETS_ID ? 'SET' : 'NOT SET',
      sheetName: process.env.GOOGLE_SHEET_NAME || 'QBO Transaction Notes',
    },
    environment: {
      dailyReportSchedule: process.env.DAILY_REPORT_SCHEDULE || 'NOT SET',
      autoStartScheduler: process.env.AUTO_START_SCHEDULER || 'false',
    },
    commonSchedules: ReportScheduler.getCommonSchedules(),
  });
});

/**
 * POST /reports/scheduler/start
 * Start the daily report scheduler
 */
router.post('/scheduler/start', (req, res) => {
  try {
    const { cronExpression } = req.body;

    if (!cronExpression) {
      return res.status(400).json({
        success: false,
        error: 'cronExpression is required',
        examples: ReportScheduler.getCommonSchedules(),
      });
    }

    ReportScheduler.start(cronExpression);

    res.json({
      success: true,
      message: 'Daily report scheduler started',
      cronExpression,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start scheduler',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /reports/scheduler/stop
 * Stop the daily report scheduler
 */
router.post('/scheduler/stop', (req, res) => {
  try {
    ReportScheduler.stop();

    res.json({
      success: true,
      message: 'Daily report scheduler stopped',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop scheduler',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /reports/preview/:date?
 * Preview what would be included in a daily report for a specific date
 */
router.get('/preview/:date?', async (req, res) => {
  try {
    const { date } = req.params;

    console.log(`📊 Generating report preview${date ? ` for ${date}` : ''}...`);

    const reportData = await DailyReportsService.generateDailyReportData(date);

    res.json({
      success: true,
      reportData: {
        date: reportData.date,
        summary: reportData.summary,
        transactions: reportData.notes.map(note => ({
          id: note.id,
          createdAt: note.created_at,
          transactionType: note.transaction_type,
          amount: note.amount,
          customerVendor: note.customer_vendor,
          note: note.note,
          createdBy: note.created_by,
        })),
      },
      message: `Found ${reportData.summary.totalNotes} transactions for ${reportData.date}`,
    });
  } catch (error) {
    console.error('❌ Report preview failed:', error);
    res.status(500).json({
      success: false,
      error: 'Report preview failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /reports/csv/today
 * Download CSV report for today's date
 */
router.get('/csv/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`📊 Generating CSV report for today: ${today}...`);

    const reportData = await DailyReportsService.generateDailyReportData(today);
    const csvResponse = CSVExportService.generateDownloadResponse(reportData);

    // Log the export
    CSVExportService.logExportSummary(reportData);

    // Set headers for download
    Object.entries(csvResponse.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send CSV content
    res.send(csvResponse.content);

    console.log(`✅ Today's CSV download completed: ${csvResponse.filename}`);
  } catch (error) {
    console.error('❌ Today\'s CSV export failed:', error);
    res.status(500).json({
      success: false,
      error: 'Today\'s CSV export failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /reports/csv/:date?
 * Download CSV report for a specific date
 */
router.get('/csv/:date?', async (req, res) => {
  try {
    const { date } = req.params;

    console.log(`📊 Generating CSV report${date ? ` for ${date}` : ''}...`);

    const reportData = await DailyReportsService.generateDailyReportData(date);
    const csvResponse = CSVExportService.generateDownloadResponse(reportData);

    // Log the export
    CSVExportService.logExportSummary(reportData);

    // Set headers for download
    Object.entries(csvResponse.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send CSV content
    res.send(csvResponse.content);

    console.log(`✅ CSV download completed: ${csvResponse.filename}`);
  } catch (error) {
    console.error('❌ CSV export failed:', error);
    res.status(500).json({
      success: false,
      error: 'CSV export failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /reports/csv-preview/:date?
 * Preview CSV data as JSON (for debugging)
 */
router.get('/csv-preview/:date?', async (req, res) => {
  try {
    const { date } = req.params;

    const reportData = await DailyReportsService.generateDailyReportData(date);
    const csv = CSVExportService.generateCSV(reportData);
    const filename = CSVExportService.generateFilename(reportData.date);

    res.json({
      success: true,
      filename,
      date: reportData.date,
      summary: reportData.summary,
      csvPreview: csv.split('\n').slice(0, 10), // First 10 lines
      totalLines: csv.split('\n').length,
    });
  } catch (error) {
    console.error('❌ CSV preview failed:', error);
    res.status(500).json({
      success: false,
      error: 'CSV preview failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;