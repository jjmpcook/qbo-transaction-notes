# QBO Transaction Notes Chrome Extension

Chrome extension that adds a floating "Add Note" button to QuickBooks Online transaction pages for capturing and sharing transaction notes with your team.

## Features

- Detects QBO transaction pages (Invoices, Bills, Expenses, Journal Entries, Payments)
- Floating "Add Note" button injection
- Modal with auto-populated transaction metadata
- Form validation and error handling
- Integration with backend API for note storage and Slack notifications

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure backend URL:
   ```bash
   cp .env.example .env
   ```
   Set `BACKEND_URL` to your backend API endpoint.

3. Build the extension:
   ```bash
   npm run build
   ```

## Development

Watch mode for development:
```bash
npm run dev
```

This will watch for changes and rebuild automatically.

## Loading in Chrome

1. Build the extension: `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `dist` folder from this project

## Usage

1. Navigate to any QuickBooks Online transaction page
2. Look for the floating "Add Note" button in the top right
3. Click to open the note modal
4. Review the auto-populated transaction data
5. Enter your note and click "Send Note"
6. Note will be saved to the database and team notified via Slack

## Supported QBO Pages

- Invoices (`/invoice`)
- Bills (`/bill`) 
- Expenses (`/expense`)
- Journal Entries (`/journal`)
- Payments (`/payment`)
- Any page with `txnId` parameter

## File Structure

- `src/content.ts` - Main content script, page detection
- `src/injectButton.ts` - Creates and styles the floating button
- `src/modal.ts` - Modal component with form handling
- `src/scraper.ts` - Extracts transaction data from DOM
- `src/types.ts` - TypeScript type definitions
- `src/styles.css` - Extension styling
- `manifest.json` - Chrome extension manifest

## Testing Locally

Create a test HTML file to simulate QBO structure:

```html
<!DOCTYPE html>
<html>
<head><title>Test QBO Page</title></head>
<body>
  <div data-automation-id="nameAddressComboBox">
    <input value="Test Customer">
  </div>
  <input data-automation-id="amount" value="1500.00">
  <input data-automation-id="transaction-date" value="01/15/2024">
  <script>
    // Simulate QBO URL
    history.replaceState({}, '', '/invoice?txnId=123');
  </script>
</body>
</html>
```

## Production Build

For Chrome Web Store submission:
```bash
npm run build
```

Then zip the `dist` folder contents for upload.