import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Starting seed...');

  // 1. Kosongkan semua tabel dengan raw query
  await prisma.$executeRawUnsafe(
    'TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE;'
  );

  // 2. Masukkan semua hero dengan createMany (id tidak perlu diisi)
  const heroesPath = path.join(__dirname, '../data/heroes.json');
  const heroesData = JSON.parse(fs.readFileSync(heroesPath, 'utf-8'));
  await prisma.hero.createMany({
    data: heroesData,
  });
  console.log(`Seeded ${heroesData.length} heroes`);

  // 3. Masukkan semua skin dengan createMany (id tidak perlu diisi)
  const skinsPath = path.join(__dirname, '../data/skins.json');
  const skinsData = JSON.parse(fs.readFileSync(skinsPath, 'utf-8'));
  await prisma.skin.createMany({
    data: skinsData,
  });
  console.log(`Seeded ${skinsData.length} skins`);

  // 4. Masukkan 3 player dan data PlayerHero
  await prisma.player.createMany({
    data: [
      { id: 1, nickname: 'ArekITS', bp: 1500, diamond: 75 },
      { id: 2, nickname: 'SangPushRank', bp: 13000, diamond: 2892 },
      { id: 3, nickname: 'MageSurabaya', bp: 10000, diamond: 0 },
    ],
  });
  console.log('Seeded 3 players');

  // Sync sequence Player agar player berikutnya mendapatkan id 4
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Player"', 'id'), COALESCE((SELECT MAX(id) FROM "Player"), 1));`
  );

  await prisma.playerHero.createMany({
    data: [
      { playerId: 1, heroId: 18, currency: 'BP', pricePaid: 2000 },
      { playerId: 1, heroId: 1, currency: 'BP', pricePaid: 10800 },
      { playerId: 2, heroId: 84, currency: 'DIAMOND', pricePaid: 599 },
      { playerId: 2, heroId: 56, currency: 'BP', pricePaid: 32000 },
    ],
  });
  console.log('Seeded 4 PlayerHero relations');

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
