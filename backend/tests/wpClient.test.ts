import { createWpClient } from '../src/services/wp';
import { prisma } from '../src/config/prisma';
import { encrypt } from '../src/utils/crypto';

describe('wp client', () => {
  it('builds auth header', async () => {
    const user = await prisma.user.create({ data: { email: `u+${Date.now()}@ex.com`, passwordHash: 'x' } });
    const conn = await prisma.connection.create({ data: { userId: user.id, type: 'WORDPRESS', displayName: 'wp', siteUrl: 'https://site.test', encryptedToken: encrypt(Buffer.from('a:b').toString('base64')) } });
    const wp = createWpClient(conn.id);
    const hdr = await wp.getAuthHeader();
    expect(hdr).toMatch(/^Basic /);
  });
});
