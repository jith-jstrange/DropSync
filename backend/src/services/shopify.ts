import Shopify from 'shopify-api-node';
import { decrypt } from '@utils/crypto';
import { prisma } from '@config/prisma';

export async function createShopifyClient(connectionId: string) {
  const conn = await prisma.connection.findUniqueOrThrow({ where: { id: connectionId } });
  if (!conn.shopDomain) throw new Error('Missing shop domain');
  const accessToken = decrypt(conn.encryptedToken);
  const shopify = new Shopify({ shopName: conn.shopDomain, accessToken, apiVersion: '2023-10' });
  return shopify;
}
