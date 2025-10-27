import { Router } from 'express';
import crypto from 'crypto';
import { env } from '@config/env';
import { prisma } from '@config/prisma';
import { encrypt } from '@utils/crypto';

const router = Router();

function buildInstallUrl(shop: string, state: string) {
  const scopes = env.shopify.scopes.join(',');
  const redirectUri = encodeURIComponent(env.shopify.redirectUri || `${env.appBaseUrl}/api/shopify/oauth/callback`);
  return `https://${shop}/admin/oauth/authorize?client_id=${env.shopify.apiKey}&scope=${encodeURIComponent(scopes)}&redirect_uri=${redirectUri}&state=${state}`;
}

router.get('/start', async (req, res) => {
  const { shop } = req.query as { shop?: string };
  if (!shop || !env.shopify.apiKey || !env.shopify.apiSecret) return res.status(400).json({ error: 'Missing shop or app keys' });
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('shopify_oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: false });
  res.redirect(buildInstallUrl(shop, state));
});

router.get('/callback', async (req, res) => {
  const { shop, code, state } = req.query as { shop?: string; code?: string; state?: string };
  const cookieState = req.cookies['shopify_oauth_state'];
  if (!shop || !code || !state || state !== cookieState) return res.status(400).json({ error: 'Invalid OAuth callback' });

  // Exchange code for access token
  const params = new URLSearchParams({
    client_id: env.shopify.apiKey!,
    client_secret: env.shopify.apiSecret!,
    code: code,
  });
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!tokenRes.ok) return res.status(400).json({ error: 'Token exchange failed' });
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // Return a small HTML page that posts message back to opener with token
  const payload = {
    shopDomain: shop,
    accessToken: access_token,
  };
  const html = `<!DOCTYPE html><html><body><script>
    (function(){
      const data = ${JSON.stringify(payload)};
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'SHOPIFY_OAUTH_SUCCESS', data }, '*');
      }
      window.close();
    })();
  </script></body></html>`;
  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

export default router;
