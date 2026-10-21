// Vercel entry point. The logic lives in server/routes/profile.js and is shared with
// Cloudflare Pages (functions/api/profile.js).
import handle from '../server/routes/profile.js';

export const GET = request => handle(request, process.env);
export const POST = GET;
