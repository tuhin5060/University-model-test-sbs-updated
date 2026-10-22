// Cloudflare Pages entry point. The logic lives in server/routes/community.js and is
// shared with Vercel (api/community.js). Needs the DATABASE_URL and ADMIN_PASSWORD secrets in Pages settings.
import handle from '../../server/routes/community.js';

export const onRequest = ({ request, env }) => handle(request, env);
