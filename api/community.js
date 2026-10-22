// Vercel entry point. The logic lives in server/routes/community.js and is shared with
// Cloudflare Pages (functions/api/community.js).
import handle from '../server/routes/community.js';

export const GET = request => handle(request, process.env);
export const POST = GET;
