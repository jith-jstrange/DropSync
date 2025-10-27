const { spawnSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
  const cwd = path.resolve(__dirname, '..');
  const result = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env },
  });
  if (result.status !== 0) {
    throw new Error('Failed to push Prisma schema for tests');
  }
};
