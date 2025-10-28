import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import router from '../src/routes/index';

const app = express();
app.use(express.json());
app.use('/api', router);

const server = createServer(app);

describe('auth routes', () => {
  it('registers and logs in', async () => {
    const email = `test+${Date.now()}@example.com`;
    const resReg = await request(server).post('/api/auth/register').send({ email, password: 'pw123456' });
    expect(resReg.status).toBe(200);
    const resLogin = await request(server).post('/api/auth/login').send({ email, password: 'pw123456' });
    expect(resLogin.status).toBe(200);
    expect(resLogin.body.token).toBeTruthy();
  });
});
