import { Router } from 'express';
import crypto from 'crypto';
import { logger } from '@config/logger';
import { syncQueue } from '@jobs/queue';

const router = Router();

// Shopify webhooks will be verified via HMAC in a full implementation.
router.post('/shopify/:topic', expressRawBody('application/json'), async (req: any, res) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) return res.status(400).end();
    const digest = crypto.createHmac('sha256', secret).update(req.rawBody).digest('base64');
    if (digest !== hmac) return res.status(401).end();
    const topic = req.params.topic;
    await syncQueue.add('shopify-webhook', { topic, payload: req.body });
    res.status(200).json({ ok: true });
  } catch (e: any) {
    logger.error('Shopify webhook error', { error: e.message });
    res.status(200).end();
  }
});

// WordPress WooCommerce webhooks (if configured) will POST JSON payloads.
router.post('/wordpress/:topic', async (req, res) => {
  const topic = req.params.topic;
  await syncQueue.add('wp-webhook', { topic, payload: req.body });
  res.status(200).json({ ok: true });
});

export default router;

function expressRawBody(type: string) {
  return (req: any, _res: any, next: any) => {
    let data: Buffer[] = [];
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => data.push(Buffer.from(chunk)));
    req.on('end', () => {
      req.rawBody = Buffer.concat(data);
      try {
        if (req.is(type)) {
          req.body = JSON.parse(req.rawBody.toString('utf8'));
        }
      } catch (_) {}
      next();
    });
  };
}
