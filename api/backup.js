// Vercel entry point. The logic lives in server/routes/backup.js and is shared with
// Cloudflare Pages (functions/api/backup.js).
import handle from '../server/routes/backup.js';

export const POST = request => handle(request, process.env);
