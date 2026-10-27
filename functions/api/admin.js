// Cloudflare Pages entry point. The logic lives in server/routes/admin.js and is
// shared with Vercel (api/admin.js).
import handle from '../../server/routes/admin.js';

export const onRequest = ({ request, env }) => handle(request, env);
