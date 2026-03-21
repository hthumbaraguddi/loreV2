/**
 * Cloudflare Worker — GitHub OAuth token exchange proxy.
 *
 * Deploy this to Cloudflare Workers (free tier is plenty).
 * Set these environment variables (Secrets) in your Worker:
 *   GITHUB_CLIENT_ID     — from your GitHub OAuth App
 *   GITHUB_CLIENT_SECRET — from your GitHub OAuth App
 *   ALLOWED_ORIGIN       — e.g. https://lore.thumbaraguddi.in
 *
 * Deploy steps:
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler deploy lore-app/workers/github-oauth.js --name lore-github-oauth
 *   4. wrangler secret put GITHUB_CLIENT_ID
 *   5. wrangler secret put GITHUB_CLIENT_SECRET
 *   6. wrangler secret put ALLOWED_ORIGIN
 *   7. Copy the worker URL into gist-sync.service.ts → GITHUB_TOKEN_PROXY
 */

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';
    const allowed = env.ALLOWED_ORIGIN ?? '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowed,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let code;
    try {
      const body = await request.json();
      code = body.code;
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    if (!code) return new Response('Missing code', { status: 400 });

    // Exchange code for token with GitHub
    const ghRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await ghRes.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowed,
      },
    });
  },
};
