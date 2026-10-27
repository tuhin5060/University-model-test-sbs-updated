// Vercel entry point. The logic lives in server/routes/admin.js and is shared with
// Cloudflare Pages (functions/api/admin.js).
import handle from '../server/routes/admin.js';

export const POST = request => handle(request, process.env);
