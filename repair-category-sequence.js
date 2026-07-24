const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8')
  .split(/\r?\n/)
  .reduce((acc, line) => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
      acc[key] = value;
    }
    return acc;
  }, {});

(async () => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: env.DIRECT_URL
      }
    }
  });

  await prisma.$executeRawUnsafe(
    `SELECT setval(
      pg_get_serial_sequence('public."Categories"', 'categoryId'),
      COALESCE((SELECT MAX("categoryId") FROM "Categories"), 0) + 1,
      false
    )`
  );

  console.log('sequence repaired');
  await prisma.$disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
