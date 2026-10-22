// Cloudflare Pages entry point. The logic lives in server/routes/push.js and is
// shared with Vercel (api/push.js). Needs the DATABASE_URL and VAPID_PRIVATE_JWK secrets.
import handle from '../../server/routes/push.js';

export const onRequest = ({ request, env }) => handle(request, env);
