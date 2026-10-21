// Vercel entry point. The logic lives in server/routes/scores.js and is shared with
// Cloudflare Pages (functions/api/scores.js).
import handle from '../server/routes/scores.js';

export const GET = request => handle(request, process.env);
export const POST = GET;
