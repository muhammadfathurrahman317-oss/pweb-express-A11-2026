# MLBB Shop: Diamond & BP - Backend Express API

Implementasi Backend REST API untuk **MLBB Shop** menggunakan **Express 5 + TypeScript + Prisma ORM 7 + PostgreSQL di Neon**.

Dibuat untuk memenuhi Penugasan Modul 4 Pemrograman Web.

---

## 🛠️ Tech Stack

- **Framework**: Express 5
- **Language**: TypeScript
- **ORM**: Prisma ORM 7 (`@prisma/client@7`, `prisma@7`)
- **Database Driver Adapter**: `@prisma/adapter-neon` (`@neondatabase/serverless`)
- **Database**: PostgreSQL di Neon Serverless
- **Runner**: `tsx`

---

## 📁 Struktur Folder

```text
pweb-express-mlbb-shop/
├── data/
│   ├── heroes.json         # 133 Hero (Miya s.d. Hirara)
│   └── skins.json          # 892 Skin
├── prisma/
│   ├── schema.prisma       # 4 Model (Hero, Skin, Player, PlayerHero) & 4 Enum
│   ├── migrations/         # Prisma migration files
│   └── seed.ts             # Seeding 133 hero, 892 skin, 3 player, 4 playerHero
├── src/
│   ├── controllers/
│   │   ├── heroController.ts
│   │   ├── skinController.ts
│   │   ├── playerController.ts
│   │   └── statisticController.ts
│   ├── errors/
│   │   └── HttpError.ts    # Custom HTTP error class
│   ├── lib/
│   │   └── prisma.ts       # Prisma Client & Neon adapter config
│   ├── middlewares/
│   │   ├── logger.ts       # Logging request terminal (e.g. GET /api/heroes 200)
│   │   └── errorHandler.ts # Centralized error & 404 not found handler
│   ├── routes/
│   │   ├── heroRoutes.ts
│   │   ├── skinRoutes.ts
│   │   ├── playerRoutes.ts
│   │   └── statisticRoutes.ts
│   ├── app.ts              # Express application setup
│   └── index.ts            # Entrypoint server (port 3000)
├── test-runner.ts          # Automated runner untuk 28 postman testcases
├── prisma.config.ts        # Prisma 7 configuration file
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore
```

---

## 🚀 Cara Menjalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Konfigurasi Environment Variables
Buat file `.env` (contoh dari `.env.example`):
```env
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require"
PORT=3000
```

### 3. Migrasi & Seeding Database
```bash
# Migrasi schema ke database
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seeding data awal
npm run seed
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Server akan berjalan di `http://localhost:3000`.

### 5. Menjalankan Pengujian Otomatis (28 Testcase)
```bash
npx tsx test-runner.ts
```

---

## 📋 Daftar Endpoint

| Fitur | Method | Endpoint | Keterangan |
| :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/health` | Health check endpoint |
| **Hero** | `GET` | `/api/heroes` | Daftar hero (pagination `page`, `limit`, search `search`, filter `role`) |
| **Hero** | `GET` | `/api/heroes/:hero_id` | Detail hero beserta daftar skin |
| **Hero** | `POST` | `/api/heroes` | Tambah hero baru |
| **Skin** | `GET` | `/api/skins` | Daftar skin beserta nama hero (`heroId`, `rarity`, pagination) |
| **Skin** | `GET` | `/api/skins/:skin_id` | Detail skin beserta data hero |
| **Player** | `POST` | `/api/players` | Buat player baru (default 10000 BP & 0 Diamond) |
| **Player** | `GET` | `/api/players/:player_id` | Detail player beserta daftar hero yang dimiliki |
| **Player** | `PATCH` | `/api/players/:player_id` | Update nickname player |
| **Player** | `DELETE` | `/api/players/:player_id` | Hapus player (cascade ke data hero yang dimiliki) |
| **Top Up** | `POST` | `/api/players/:player_id/topup` | Top up diamond player (amount > 0) |
| **Match** | `POST` | `/api/players/:player_id/matches` | Tambah hadiah match (WIN +300 BP, LOSE +100 BP) |
| **Beli Hero**| `POST` | `/api/players/:player_id/heroes` | Beli hero dengan BP atau Diamond (atomic transaction) |
| **Statistik**| `GET` | `/api/statistics` | Statistik toko (total player, hero owned, total diamond, most owned hero, hero per role) |

---

## 🧪 Hasil Pengujian (28 / 28 Passed)

Semua 28 skenario pengujian Postman telah divalidasi dan berhasil 100%:
- ✅ 01. Health Check (200)
- ✅ 02. Daftar Hero Role Marksman (200, totalItems: 20)
- ✅ 03. Cari Hero 'la' (200, totalItems: 10)
- ✅ 04. Detail Hero Layla (200, 11 skins)
- ✅ 05. Detail Hero Tidak Ada (404)
- ✅ 06. Tambah Hero Collie (201, id 134)
- ✅ 07. Tambah Hero Nama Sudah Ada (409)
- ✅ 08. Tambah Hero Data Kurang (400)
- ✅ 09. Daftar Skin Layla (200, totalItems: 11)
- ✅ 10. Daftar Skin Rarity GRAND (200, totalItems: 98)
- ✅ 11. Detail Skin Silverbolt Raiko (200, Selena)
- ✅ 12. Buat Player JunglerMalam (201, id 4)
- ✅ 13. Buat Player Nickname Dipakai (409)
- ✅ 14. Top Up 706 Diamond (200, diamond: 706)
- ✅ 15. Top Up Amount Negatif (400)
- ✅ 16. Match Menang WIN (200, bp: 10300)
- ✅ 17. Beli Freya Pakai BP Gagal (400)
- ✅ 18. Beli Freya Pakai Diamond (201, diamond: 107)
- ✅ 19. Beli Layla Pakai BP (201, bp: 8300)
- ✅ 20. Beli Layla Lagi Sudah Punya (409)
- ✅ 21. Beli Hirara BP Kurang (400)
- ✅ 22. Detail Player MageSurabaya (200, Freya & Layla)
- ✅ 23. Ganti Nickname Jadi MageITS (200)
- ✅ 24. Ganti Nickname Dipakai (409)
- ✅ 25. Statistik Toko (200)
- ✅ 26. Hapus Player JunglerMalam (200)
- ✅ 27. Detail Player Terhapus (404)
- ✅ 28. Endpoint Tidak Ada (404)
