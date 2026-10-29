// Vercel Cron entry point (vercel.json → crons, daily 01:00 UTC ≈ 7 AM Bangladesh):
// "today's Daily Quiz is ready". The logic lives in server/routes/push.js.
import { cron } from '../server/routes/push.js';

export const GET = request => cron(request, process.env, 'morning');
