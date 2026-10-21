// Vercel entry point. The logic lives in server/routes/visitors.js and is shared with
// Cloudflare Pages (functions/api/visitors.js).
import handle from '../server/routes/visitors.js';

export const GET = request => handle(request, process.env);
export const POST = GET;
