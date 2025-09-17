# Google Sheets Integration Setup Guide

This guide will walk you through setting up automated daily reports that are sent to a Google Spreadsheet.

## Overview

The system will:
✅ **Automatically append daily data** to your existing Google Sheet
✅ **Schedule reports** at your preferred time (Pacific Time)
✅ **Include all transaction details** plus daily summaries
✅ **Format data professionally** with headers and proper columns

## Step 1: Create Google Service Account

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing project
3. **Enable Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. **Create Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Name: `qbo-reports-service`
   - Description: `Service account for QBO transaction reports`
   - Click "Create and Continue"

5. **Generate Private Key**:
   - Click on your new service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose "JSON" format
   - Download the JSON file

## Step 2: Create Google Spreadsheet

1. **Create new Google Sheet**: https://sheets.google.com
2. **Name it**: `QBO Transaction Reports` (or your preferred name)
3. **Copy the Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```
4. **Share with Service Account**:
   - Click "Share" button
   - Add your service account email (from the JSON file)
   - Give "Editor" permissions

## Step 3: Configure Environment Variables

Add these to your `.env` file:

```bash
# Google Sheets Integration
GOOGLE_SHEETS_ID=your-spreadsheet-id-here
GOOGLE_SHEET_NAME=Sheet1
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Daily Report Scheduler (Pacific Time)
DAILY_REPORT_SCHEDULE=0 9 * * 1-5
AUTO_START_SCHEDULER=true
```

### Finding Your Values:

**From the downloaded JSON file:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `client_email` field
- `GOOGLE_PRIVATE_KEY` = `private_key` field (keep the \\n characters)

**Schedule Examples:**
- `0 9 * * 1-5` = 9:00 AM, Monday-Friday
- `0 17 * * *` = 5:00 PM, every day
- `0 8 * * 1,3,5` = 8:00 AM, Monday/Wednesday/Friday

## Step 4: Test the Integration

After setting up environment variables and redeploying:

### Test Connection:
```bash
curl https://your-backend-url.com/reports/test
```

### Manual Report:
```bash
curl -X POST https://your-backend-url.com/reports/manual
```

### Check Status:
```bash
curl https://your-backend-url.com/reports/status
```

## Step 5: Your Daily Reports

### What Gets Sent:
- **Individual rows** for each transaction with all details
- **Daily summary** with totals and transaction type breakdown
- **Professional formatting** with headers and proper data types

### Sheet Columns:
1. **Report Date** - Date the report was generated
2. **Created At** - When transaction was submitted (Pacific Time)
3. **Transaction Type** - Invoice, Expense, Bill, etc.
4. **Transaction ID** - QBO transaction ID
5. **Date** - Transaction date
6. **Amount** - Transaction amount
7. **Customer/Vendor** - Customer or vendor name
8. **Invoice/Bill #** - Invoice or bill number
9. **Note** - The change request note
10. **Created By** - Who submitted the note
11. **Status** - Current status
12. **QuickBooks URL** - Link to view in QBO

## API Endpoints

Your backend now has these endpoints:

- `GET /reports/status` - Check configuration and scheduler status
- `GET /reports/test` - Test Google Sheets connection
- `POST /reports/manual` - Trigger manual report
- `POST /reports/scheduler/start` - Start scheduler with custom schedule
- `POST /reports/scheduler/stop` - Stop scheduler
- `GET /reports/preview/2024-01-15` - Preview what would be in a report

## Troubleshooting

### Common Issues:

1. **"Google Sheets not configured"**
   - Check that all environment variables are set
   - Verify the private key format (should include \\n characters)

2. **"Permission denied"**
   - Make sure you shared the spreadsheet with the service account email
   - Verify the service account has Editor permissions

3. **"Spreadsheet not found"**
   - Double-check the spreadsheet ID in the URL
   - Make sure the spreadsheet exists and is accessible

4. **"No transactions found"**
   - The system reports on yesterday's data by default
   - Make sure you have submitted some transaction notes

### Check Logs:
Your deployed backend will show detailed logs for debugging:
- Connection attempts
- Data being sent
- Any errors encountered

## Schedule Management

### Start Scheduler:
```bash
curl -X POST https://your-backend-url.com/reports/scheduler/start \
  -H "Content-Type: application/json" \
  -d '{"cronExpression": "0 9 * * 1-5"}'
```

### Stop Scheduler:
```bash
curl -X POST https://your-backend-url.com/reports/scheduler/stop
```

The scheduler runs automatically if `AUTO_START_SCHEDULER=true` is set in your environment variables.