// Vercel entry point. The logic lives in server/routes/daily.js and is shared with
// Cloudflare Pages (functions/api/daily.js).
import handle from '../server/routes/daily.js';

export const GET = request => handle(request, process.env);
export const POST = GET;
