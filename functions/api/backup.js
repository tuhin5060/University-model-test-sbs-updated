// Cloudflare Pages entry point. The logic lives in server/routes/backup.js and is
// shared with Vercel (api/backup.js).
import handle from '../../server/routes/backup.js';

export const onRequest = ({ request, env }) => handle(request, env);
