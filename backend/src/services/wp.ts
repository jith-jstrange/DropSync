import axios from 'axios';
import { decrypt } from '@utils/crypto';
import { prisma } from '@config/prisma';

export function createWpClient(connectionId: string) {
  return {
    async getAuthHeader() {
      const conn = await prisma.connection.findUniqueOrThrow({ where: { id: connectionId } });
      const token = decrypt(conn.encryptedToken);
      return `Basic ${token}`;
    },
    async get<T>(path: string, params?: Record<string, any>) {
      const conn = await prisma.connection.findUniqueOrThrow({ where: { id: connectionId } });
      const headers = { Authorization: await this.getAuthHeader() };
      const url = `${conn.siteUrl!.replace(/\/$/, '')}/wp-json/wc/v3${path}`;
      const res = await axios.get<T>(url, { params, headers });
      return res.data;
    },
    async post<T>(path: string, body: any) {
      const conn = await prisma.connection.findUniqueOrThrow({ where: { id: connectionId } });
      const headers = { Authorization: await this.getAuthHeader() };
      const url = `${conn.siteUrl!.replace(/\/$/, '')}/wp-json/wc/v3${path}`;
      const res = await axios.post<T>(url, body, { headers });
      return res.data;
    },
    async put<T>(path: string, body: any) {
      const conn = await prisma.connection.findUniqueOrThrow({ where: { id: connectionId } });
      const headers = { Authorization: await this.getAuthHeader() };
      const url = `${conn.siteUrl!.replace(/\/$/, '')}/wp-json/wc/v3${path}`;
      const res = await axios.put<T>(url, body, { headers });
      return res.data;
    },
  };
}
