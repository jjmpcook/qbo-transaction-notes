# QBO Transaction Notes - Chrome Extension & Backend

Complete solution for adding notes to QuickBooks Online transactions with team notifications via Slack.

## Project Structure

```
├── backend/          # Node.js + Express API
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── extension/        # Chrome Extension (Manifest v3)
│   ├── src/
│   ├── manifest.json
│   ├── .env.example
│   └── README.md
│
└── README.md        # This file
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your .env with Supabase & Slack credentials
npm run dev
```

### 2. Extension Setup

```bash
cd extension  
npm install
cp .env.example .env
# Set BACKEND_URL=http://localhost:3000
npm run build
```

### 3. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"  
4. Select the `extension/dist` folder

### 4. Database Setup

In your Supabase SQL editor, run:

```sql
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  transaction_url text not null,
  transaction_id text,
  transaction_type text,
  date text,
  amount numeric,
  customer_vendor text,
  note text not null,
  created_by text,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);
```

## How It Works

1. **Extension Detection**: Content script detects QBO transaction pages
2. **Button Injection**: Floating "Add Note" button appears
3. **Data Scraping**: Modal auto-populates with transaction metadata  
4. **API Submission**: Note sent to backend API
5. **Database Storage**: Note saved to Supabase PostgreSQL
6. **Team Notification**: Slack webhook sends formatted message

## Environment Variables

### Backend (.env)
```
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
```

### Extension (.env)  
```
BACKEND_URL=http://localhost:3000
```

## Testing

Test the backend API using the included `backend/seed.http` file with REST client tools.

For extension testing, visit any QBO transaction page while extension is loaded.

## Deployment

- **Backend**: Deploy to Vercel, Render, Railway, etc.
- **Extension**: Package `extension/dist` folder for Chrome Web Store

## Features

✅ Manifest v3 Chrome Extension  
✅ TypeScript throughout  
✅ Supabase PostgreSQL database  
✅ Slack webhook notifications  
✅ Form validation & error handling  
✅ Responsive modal design  
✅ Transaction data auto-population  
✅ CORS configured for QBO domains  

## MVP Scope

This implementation covers the full MVP requirements:
- No QuickBooks API integration (DOM scraping only)
- No authentication/user roles  
- No file uploads
- No mobile support
- Basic note capture and team notification

## Next Steps

After MVP validation, consider:
- QuickBooks API integration for reliable data
- User authentication and roles
- Note editing and status management  
- File attachment support
- Mobile-responsive design