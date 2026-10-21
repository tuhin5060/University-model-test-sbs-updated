// Vercel entry point. The logic lives in server/routes/progress.js and is shared with
// Cloudflare Pages (functions/api/progress.js).
import handle from '../server/routes/progress.js';

export const GET = request => handle(request, process.env);
export const POST = GET;
