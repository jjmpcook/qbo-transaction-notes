import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import notesRouter from './routes/notes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
  origin: [
    /^https:\/\/.*\.qbo\.intuit\.com$/,
    /^https:\/\/.*\.intuit\.com$/,
    /^chrome-extension:\/\/.*$/,
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/debug-env', (req, res) => {
  res.json({
    node_env: process.env.NODE_ENV,
    has_supabase_url: !!process.env.SUPABASE_URL,
    has_supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabase_url: process.env.SUPABASE_URL,
    supabase_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    all_env_keys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  });
});

app.get('/debug', (req, res) => {
  res.json({
    node_env: process.env.NODE_ENV,
    has_supabase_url: !!process.env.SUPABASE_URL,
    has_supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabase_url_length: process.env.SUPABASE_URL?.length || 0,
    has_slack_bot_token: !!process.env.SLACK_BOT_TOKEN,
    has_slack_channel: !!process.env.SLACK_CHANNEL,
    slack_channel_value: process.env.SLACK_CHANNEL,
    slack_shared_channel_value: process.env.SLACK_SHARED_CHANNEL,
    all_env_keys: Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('SLACK')),
    all_env_keys_starting_with_s: Object.keys(process.env).filter(key => key.startsWith('S'))
  });
});

app.use('/', notesRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});