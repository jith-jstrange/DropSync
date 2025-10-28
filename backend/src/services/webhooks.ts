import { prisma } from '@config/prisma';
import { env } from '@config/env';
import Shopify from 'shopify-api-node';
import { decrypt } from '@utils/crypto';

export async function registerShopifyWebhooks(connectionId: string) {
  const conn = await prisma.connection.findUniqueOrThrow({ where: { id: connectionId } });
  if (!conn.shopDomain) throw new Error('Missing shop domain');
  const accessToken = decrypt(conn.encryptedToken);
  const shopify = new Shopify({ shopName: conn.shopDomain, accessToken, apiVersion: '2023-10' });
  const address = `${env.appBaseUrl}/webhook/shopify/orders/create`;
  const topics = ['orders/create', 'orders/updated', 'products/create', 'products/update', 'inventory_levels/update'] as const;
  for (const topic of topics) {
    try {
      await shopify.webhook.create({ topic: topic as any, address, format: 'json' });
      await prisma.webhook.create({ data: { connectionId, topic, targetUrl: address } });
    } catch {
      // Ignore if exists or fails silently
    }
  }
}

export async function registerWpWebhooks(_connectionId: string) {
  // WooCommerce webhook registration can be done via API, but many hosts restrict it.
  // We'll leave this as a no-op placeholder; users can configure site to call /webhook/wordpress/* endpoints.
}
