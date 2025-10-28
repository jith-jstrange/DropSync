import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '@config/prisma';
import { env } from '@config/env';

export async function register(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const passwordHash = await argon2.hash(password);
  try {
    const user = await prisma.user.create({ data: { email, passwordHash } });
    return res.json({ id: user.id, email: user.email });
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email already registered' });
    return res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, env.jwtSecret, { expiresIn: '7d' });
  return res.json({ token });
}
