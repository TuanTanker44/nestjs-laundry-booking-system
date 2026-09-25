import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Testing Prisma connection...');

  await prisma.$connect();

  console.log('✅ Prisma connected successfully!');

  const result = await prisma.$queryRaw`SELECT NOW() AS current_time`;

  console.log('Database response:', result);
}

main()
  .catch((error) => {
    console.error('❌ Prisma test failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });