# QBO Transaction Notes Backend

Backend API for the QuickBooks Online transaction notes Chrome extension.

## Features

- Express.js REST API with TypeScript
- Supabase PostgreSQL database integration
- Slack webhook notifications
- Input validation with Zod
- CORS enabled for Chrome extension

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file with:
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project
   - `SLACK_WEBHOOK_URL` from your Slack app
   - `PORT` (default: 3000)

4. Set up Supabase database table:
   ```sql
   create table if not exists notes (
     id uuid primary key default gen_random_uuid(),
     transaction_url text not null,
     transaction_id text,
     transaction_type text,
     date text,
     amount numeric,
     customer_vendor text,
     invoice_number text,
     note text not null,
     created_by text,
     status text not null default 'Open',
     created_at timestamptz not null default now()
   );
   
   -- If table already exists, add the invoice_number column:
   alter table notes add column if not exists invoice_number text;
   ```

## Development

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

## API Endpoints

- `GET /health` - Health check
- `POST /notes` - Create a new transaction note

### POST /notes

Request body:
```json
{
  "transaction_url": "string",
  "transaction_id": "string", 
  "transaction_type": "string",
  "date": "string",
  "amount": "number",
  "customer_vendor": "string",
  "note": "string", // required
  "created_by": "string" // optional
}
```

Response (201):
```json
{
  "id": "uuid",
  "success": true
}
```

## Testing

Use the provided `seed.http` file to test endpoints with a REST client like VS Code REST Client extension.

## Deployment

Deploy to Vercel, Render, or similar platforms. Make sure to set environment variables in your deployment platform.