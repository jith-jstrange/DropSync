import { Router } from 'express';
import { requireAuth, AuthRequest } from '@middleware/auth';
import { prisma } from '@config/prisma';
import { createShopifyClient } from '@services/shopify';
import { createWpClient } from '@services/wp';
import { syncQueue } from '@jobs/queue';
import { logger } from '@config/logger';

const router = Router();

router.post('/trigger', requireAuth, async (req: AuthRequest, res) => {
  const { connectionId, type } = req.body as { connectionId: string; type: 'products' | 'inventory' | 'orders' };
  await syncQueue.add('manual-sync', { userId: req.user!.id, connectionId, type });
  res.json({ enqueued: true });
});

// Minimal initial sync task
syncQueue.process(async (job) => {
  const { connectionId, type } = job.data as { connectionId: string; type: string };
  const conn = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!conn) return;
  if (conn.type === 'SHOPIFY') {
    const shopify = await createShopifyClient(connectionId);
    if (type === 'products') {
      await shopify.product.list({ limit: 5 });
    }
  } else if (conn.type === 'WORDPRESS') {
    const wp = createWpClient(connectionId);
    if (type === 'products') {
      await wp.get('/products', { per_page: 5 });
    }
  }
});

// Minimal webhook-driven sync handlers
syncQueue.process(async (job) => {
  if (job.name === 'shopify-webhook') {
    const { topic } = job.data as { topic: string; payload: any };
    logger.info('Shopify webhook received', { topic });
  }
  if (job.name === 'wp-webhook') {
    const { topic } = job.data as { topic: string; payload: any };
    logger.info('WP webhook received', { topic });
  }
});

export default router;
