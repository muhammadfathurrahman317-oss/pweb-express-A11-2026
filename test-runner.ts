import request from 'supertest';
import app from './src/app';
import { prisma } from './src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function resetAndSeed() {
  console.log('--- Resetting and Seeding Database ---');
  await prisma.$executeRawUnsafe(
    'TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE;'
  );

  const heroesPath = path.join(__dirname, 'data/heroes.json');
  const heroesData = JSON.parse(fs.readFileSync(heroesPath, 'utf-8'));
  await prisma.hero.createMany({ data: heroesData });

  const skinsPath = path.join(__dirname, 'data/skins.json');
  const skinsData = JSON.parse(fs.readFileSync(skinsPath, 'utf-8'));
  await prisma.skin.createMany({ data: skinsData });

  await prisma.player.createMany({
    data: [
      { id: 1, nickname: 'ArekITS', bp: 1500, diamond: 75 },
      { id: 2, nickname: 'SangPushRank', bp: 13000, diamond: 2892 },
      { id: 3, nickname: 'MageSurabaya', bp: 10000, diamond: 0 },
    ],
  });

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
  console.log('Seed completed!\n');
}

async function runTests() {
  await resetAndSeed();

  const results: { test: string; status: number; expected: number; passed: boolean; detail?: any }[] = [];

  function record(name: string, res: any, expected: number, extraCheck = true, detail = '') {
    const passed = res.status === expected && extraCheck;
    results.push({ test: name, status: res.status, expected, passed, detail: detail || JSON.stringify(res.body) });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} -> Got ${res.status}, Expected ${expected}`);
    if (!passed) {
      console.log('   Response Body:', res.body);
    }
  }

  // 01. Health Check
  let res = await request(app).get('/health');
  record('01. Health Check', res, 200, res.body.status === true);

  // 02. Daftar Hero Role Marksman
  res = await request(app).get('/api/heroes?role=MARKSMAN&limit=5');
  record(
    '02. Daftar Hero Role Marksman',
    res,
    200,
    res.body.metadata?.totalItems === 20 && res.body.data?.length === 5
  );

  // 03. Cari Hero 'la'
  res = await request(app).get('/api/heroes?search=la');
  record('03. Cari Hero "la"', res, 200, res.body.metadata?.totalItems === 10);

  // 04. Detail Hero Layla
  res = await request(app).get('/api/heroes/18');
  record(
    '04. Detail Hero Layla',
    res,
    200,
    res.body.data?.name === 'Layla' && res.body.data?.skins?.length === 11
  );

  // 05. Detail Hero Tidak Ada
  res = await request(app).get('/api/heroes/999');
  record('05. Detail Hero Tidak Ada', res, 404, res.body.status === false);

  // 06. Tambah Hero Collie
  res = await request(app).post('/api/heroes').send({
    name: 'Collie',
    role: 'MAGE',
    lane: 'MID',
    releaseYear: 2026,
    priceBP: 32000,
    priceDiamond: 599,
  });
  record('06. Tambah Hero Collie', res, 201, res.body.data?.id === 134);

  // 07. Tambah Hero Nama Sudah Ada
  res = await request(app).post('/api/heroes').send({
    name: 'Collie',
    role: 'MAGE',
    lane: 'MID',
    releaseYear: 2026,
    priceBP: 32000,
    priceDiamond: 599,
  });
  record('07. Tambah Hero Nama Sudah Ada', res, 409, res.body.status === false);

  // 08. Tambah Hero Data Kurang
  res = await request(app).post('/api/heroes').send({
    name: 'Kaiden',
  });
  record('08. Tambah Hero Data Kurang', res, 400, res.body.status === false);

  // 09. Daftar Skin Layla
  res = await request(app).get('/api/skins?heroId=18');
  record('09. Daftar Skin Layla', res, 200, res.body.metadata?.totalItems === 11);

  // 10. Daftar Skin Rarity GRAND
  res = await request(app).get('/api/skins?rarity=GRAND');
  record('10. Daftar Skin Rarity GRAND', res, 200, res.body.metadata?.totalItems === 98);

  // 11. Detail Skin Silverbolt Raiko
  res = await request(app).get('/api/skins/891');
  record(
    '11. Detail Skin Silverbolt Raiko',
    res,
    200,
    res.body.data?.name === 'Silverbolt Raiko' && res.body.data?.hero?.name === 'Selena'
  );

  // 12. Buat Player JunglerMalam
  res = await request(app).post('/api/players').send({
    nickname: 'JunglerMalam',
  });
  record('12. Buat Player JunglerMalam', res, 201, res.body.data?.id === 4);

  // 13. Buat Player Nickname Dipakai
  res = await request(app).post('/api/players').send({
    nickname: 'ArekITS',
  });
  record('13. Buat Player Nickname Dipakai', res, 409, res.body.status === false);

  // 14. Top Up 706 Diamond
  res = await request(app).post('/api/players/3/topup').send({
    amount: 706,
  });
  record('14. Top Up 706 Diamond', res, 200, res.body.data?.diamond === 706);

  // 15. Top Up Amount Negatif
  res = await request(app).post('/api/players/3/topup').send({
    amount: -10,
  });
  record('15. Top Up Amount Negatif', res, 400, res.body.status === false);

  // 16. Match Menang (WIN)
  res = await request(app).post('/api/players/3/matches').send({
    result: 'WIN',
  });
  record('16. Match Menang (WIN)', res, 200, res.body.data?.bp === 10300);

  // 17. Beli Freya Pakai BP (Gagal)
  res = await request(app).post('/api/players/3/heroes').send({
    heroId: 22,
    currency: 'BP',
  });
  record('17. Beli Freya Pakai BP (Gagal)', res, 400, res.body.status === false);

  // 18. Beli Freya Pakai Diamond
  res = await request(app).post('/api/players/3/heroes').send({
    heroId: 22,
    currency: 'DIAMOND',
  });
  record(
    '18. Beli Freya Pakai Diamond',
    res,
    201,
    res.body.data?.balance?.diamond === 107
  );

  // 19. Beli Layla Pakai BP
  res = await request(app).post('/api/players/3/heroes').send({
    heroId: 18,
    currency: 'BP',
  });
  record(
    '19. Beli Layla Pakai BP',
    res,
    201,
    res.body.data?.balance?.bp === 8300
  );

  // 20. Beli Layla Lagi (Sudah Punya)
  res = await request(app).post('/api/players/3/heroes').send({
    heroId: 18,
    currency: 'DIAMOND',
  });
  record('20. Beli Layla Lagi (Sudah Punya)', res, 409, res.body.status === false);

  // 21. Beli Hirara BP Kurang
  res = await request(app).post('/api/players/1/heroes').send({
    heroId: 133,
    currency: 'BP',
  });
  record('21. Beli Hirara BP Kurang', res, 400, res.body.status === false);

  // 22. Detail Player MageSurabaya
  res = await request(app).get('/api/players/3');
  record(
    '22. Detail Player MageSurabaya',
    res,
    200,
    res.body.data?.heroes?.length === 2 &&
      res.body.data?.heroes?.some((h: any) => h.heroId === 22) &&
      res.body.data?.heroes?.some((h: any) => h.heroId === 18)
  );

  // 23. Ganti Nickname Jadi MageITS
  res = await request(app).patch('/api/players/3').send({
    nickname: 'MageITS',
  });
  record('23. Ganti Nickname Jadi MageITS', res, 200, res.body.data?.nickname === 'MageITS');

  // 24. Ganti Nickname Dipakai
  res = await request(app).patch('/api/players/3').send({
    nickname: 'ArekITS',
  });
  record('24. Ganti Nickname Dipakai', res, 409, res.body.status === false);

  // 25. Statistik Toko
  res = await request(app).get('/api/statistics');
  record(
    '25. Statistik Toko',
    res,
    200,
    res.body.data?.totalPlayers === 4 &&
      res.body.data?.totalHeroesOwned === 6 &&
      Array.isArray(res.body.data?.heroesPerRole)
  );

  // 26. Hapus Player JunglerMalam
  res = await request(app).delete('/api/players/4');
  record('26. Hapus Player JunglerMalam', res, 200, res.body.status === true);

  // 27. Detail Player Terhapus
  res = await request(app).get('/api/players/4');
  record('27. Detail Player Terhapus', res, 404, res.body.status === false);

  // 28. Endpoint Tidak Ada
  res = await request(app).get('/api/ngawur');
  record('28. Endpoint Tidak Ada', res, 404, res.body.status === false);

  console.log('\n=======================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`OVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED! 🎉' : 'SOME TESTS FAILED ❌'}`);
  console.log('=======================================\n');

  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
