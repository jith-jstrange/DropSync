import { Router } from 'express';
import * as auth from '@controllers/authController';
import * as conn from '@controllers/connectionController';
import { requireAuth } from '@middleware/auth';
import shopifyOAuth from './shopifyOAuth';

const router = Router();

router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.use('/shopify/oauth', shopifyOAuth);

router.get('/connections', requireAuth, conn.listConnections);
router.post('/connections/wordpress', requireAuth, conn.addWordPress);
router.post('/connections/shopify', requireAuth, conn.addShopify);
router.delete('/connections/:id', requireAuth, conn.removeConnection);

export default router;
