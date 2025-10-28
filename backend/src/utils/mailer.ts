import nodemailer from 'nodemailer';
import { env } from '@config/env';

export function getTransport() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass || !env.smtp.port) {
    return null;
  }
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: false,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
}

export async function sendEmail(to: string, subject: string, text: string) {
  const transport = getTransport();
  if (!transport) return; // silently skip if not configured
  await transport.sendMail({ from: env.smtp.user!, to, subject, text });
}
