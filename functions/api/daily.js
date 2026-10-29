// Cloudflare Pages entry point. The logic lives in server/routes/daily.js and is
// shared with Vercel (api/daily.js). Needs the DATABASE_URL secret in Pages settings.
import handle from '../../server/routes/daily.js';

export const onRequest = ({ request, env }) => handle(request, env);
