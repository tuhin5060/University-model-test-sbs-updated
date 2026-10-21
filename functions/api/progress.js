// Cloudflare Pages entry point. The logic lives in server/routes/progress.js and is
// shared with Vercel (api/progress.js). Needs the DATABASE_URL secret in Pages settings.
import handle from '../../server/routes/progress.js';

export const onRequest = ({ request, env }) => handle(request, env);
