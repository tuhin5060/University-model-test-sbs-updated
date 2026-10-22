// Vercel Cron entry point (vercel.json → crons, daily 14:00 UTC = 8 PM Bangladesh).
// The logic lives in server/routes/push.js.
import { cron } from '../server/routes/push.js';

export const GET = request => cron(request, process.env);
