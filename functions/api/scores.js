// Cloudflare Pages entry point. The logic lives in server/routes/scores.js and is
// shared with Vercel (api/scores.js). Needs the DATABASE_URL secret in Pages settings.
import handle from '../../server/routes/scores.js';

export const onRequest = ({ request, env }) => handle(request, env);
