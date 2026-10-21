// Cloudflare Pages entry point. The logic lives in server/routes/profile.js and is
// shared with Vercel (api/profile.js). Needs the DATABASE_URL secret in Pages settings.
import handle from '../../server/routes/profile.js';

export const onRequest = ({ request, env }) => handle(request, env);
