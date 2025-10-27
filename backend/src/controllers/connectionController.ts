import { Response } from 'express';
import { prisma } from '@config/prisma';
import { encrypt, decrypt } from '@utils/crypto';
import { registerShopifyWebhooks } from '@services/webhooks';
import { AuthRequest } from '@middleware/auth';

export async function listConnections(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const connections = await prisma.connection.findMany({ where: { userId } });
  return res.json(connections.map(c => ({ ...c, encryptedToken: undefined })));
}

export async function addWordPress(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { siteUrl, displayName, appUsername, appPassword } = req.body as {
    siteUrl: string; displayName: string; appUsername: string; appPassword: string;
  };
  if (!siteUrl || !appUsername || !appPassword) return res.status(400).json({ error: 'Missing fields' });
  const token = Buffer.from(`${appUsername}:${appPassword}`).toString('base64');
  const encryptedToken = encrypt(token);
  const conn = await prisma.connection.create({ data: {
    userId, type: 'WORDPRESS', displayName: displayName || siteUrl, siteUrl, encryptedToken
  }});
  return res.json({ id: conn.id });
}

export async function addShopify(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { shopDomain, displayName, accessToken } = req.body as {
    shopDomain: string; displayName?: string; accessToken: string;
  };
  if (!shopDomain || !accessToken) return res.status(400).json({ error: 'Missing fields' });
  const encryptedToken = encrypt(accessToken);
  const conn = await prisma.connection.create({ data: {
    userId, type: 'SHOPIFY', displayName: displayName || shopDomain, shopDomain, encryptedToken
  }});
  // best-effort webhook registration
  registerShopifyWebhooks(conn.id).catch(() => void 0);
  return res.json({ id: conn.id });
}

export async function removeConnection(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;
  const existing = await prisma.connection.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'Not found' });
  await prisma.webhook.deleteMany({ where: { connectionId: id } });
  await prisma.connection.delete({ where: { id } });
  return res.json({ ok: true });
}
