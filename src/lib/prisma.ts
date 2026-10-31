import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_1EHMRcvPN4uV@ep-lively-mountain-a1gxrhid-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
