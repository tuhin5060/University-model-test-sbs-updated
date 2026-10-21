// Cloudflare Pages entry point. The logic lives in server/routes/visitors.js and is
// shared with Vercel (api/visitors.js). Needs the DATABASE_URL secret in Pages settings.
import handle from '../../server/routes/visitors.js';

export const onRequest = ({ request, env }) => handle(request, env);
