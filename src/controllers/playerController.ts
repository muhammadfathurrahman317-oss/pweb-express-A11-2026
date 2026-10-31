import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../errors/HttpError';
import { Currency } from '@prisma/client';

export const createPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nickname } = req.body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      throw new HttpError(400, 'Nickname wajib diisi');
    }

    const existingPlayer = await prisma.player.findUnique({
      where: { nickname: nickname.trim() },
    });

    if (existingPlayer) {
      throw new HttpError(409, 'Nickname sudah digunakan');
    }

    const newPlayer = await prisma.player.create({
      data: {
        nickname: nickname.trim(),
      },
    });

    return res.status(201).json({
      status: true,
      message: 'Player berhasil dibuat',
      data: newPlayer,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlayerDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = parseInt(req.params.player_id as string, 10);
    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        heroes: {
          include: {
            hero: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    const formattedHeroes = player.heroes.map((ph) => ({
      heroId: ph.heroId,
      name: ph.hero.name,
      currency: ph.currency,
      pricePaid: ph.pricePaid,
    }));

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data player',
      data: {
        id: player.id,
        nickname: player.nickname,
        bp: player.bp,
        diamond: player.diamond,
        createdAt: player.createdAt,
        heroes: formattedHeroes,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = parseInt(req.params.player_id as string, 10);
    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    const { nickname } = req.body;
    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      throw new HttpError(400, 'Nickname wajib diisi');
    }

    const existingOther = await prisma.player.findFirst({
      where: {
        nickname: nickname.trim(),
        NOT: { id: playerId },
      },
    });

    if (existingOther) {
      throw new HttpError(409, 'Nickname sudah digunakan oleh player lain');
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { nickname: nickname.trim() },
    });

    return res.status(200).json({
      status: true,
      message: 'Player berhasil diperbarui',
      data: updatedPlayer,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = parseInt(req.params.player_id as string, 10);
    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    await prisma.player.delete({
      where: { id: playerId },
    });

    return res.status(200).json({
      status: true,
      message: 'Player berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

export const topupDiamond = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = parseInt(req.params.player_id as string, 10);
    const { amount } = req.body;

    // 1. amount bukan bilangan bulat lebih dari 0 -> 400
    if (
      typeof amount !== 'number' ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      throw new HttpError(
        400,
        'Amount harus berupa bilangan bulat lebih dari 0'
      );
    }

    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    // 2. Player tidak ditemukan -> 404
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    // 3. Berhasil: tambah diamond player dengan increment, lalu balas 200
    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        diamond: { increment: amount },
      },
    });

    return res.status(200).json({
      status: true,
      message: 'Top up berhasil',
      data: {
        playerId: updated.id,
        amount,
        diamond: updated.diamond,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const matchResult = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = parseInt(req.params.player_id as string, 10);
    const { result } = req.body;

    // 1. result bukan WIN/LOSE -> 400
    if (result !== 'WIN' && result !== 'LOSE') {
      throw new HttpError(400, 'Result harus berupa WIN atau LOSE');
    }

    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    // 2. Player tidak ditemukan -> 404
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    const bpEarned = result === 'WIN' ? 300 : 100;

    // 3. Berhasil: tambah bp player dengan increment, lalu balas 200
    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        bp: { increment: bpEarned },
      },
    });

    return res.status(200).json({
      status: true,
      message: 'Hadiah match berhasil ditambahkan',
      data: {
        playerId: updated.id,
        result,
        bpEarned,
        bp: updated.bp,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const buyHero = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = parseInt(req.params.player_id as string, 10);
    const { heroId, currency } = req.body;

    // 1. heroId kosong, atau currency bukan BP/DIAMOND -> 400
    if (
      !heroId ||
      typeof heroId !== 'number' ||
      (currency !== 'BP' && currency !== 'DIAMOND')
    ) {
      throw new HttpError(
        400,
        'heroId harus diisi dan currency harus BP atau DIAMOND'
      );
    }

    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    // 2. Player tidak ditemukan -> 404
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    // 3. Hero tidak ditemukan -> 404
    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
    });
    if (!hero) {
      throw new HttpError(404, 'Hero tidak ditemukan');
    }

    // 4. Harga hero untuk currency tersebut kosong -> 400
    const price = currency === 'BP' ? hero.priceBP : hero.priceDiamond;
    if (price === null || price === undefined) {
      throw new HttpError(
        400,
        `Hero ${hero.name} tidak bisa dibeli dengan ${currency}`
      );
    }

    // 5. Player sudah memiliki hero tersebut -> 409
    const alreadyOwned = await prisma.playerHero.findUnique({
      where: {
        playerId_heroId: {
          playerId,
          heroId,
        },
      },
    });
    if (alreadyOwned) {
      throw new HttpError(409, 'Player sudah memiliki hero ini');
    }

    // 6. Saldo player kurang dari harga hero -> 400
    const currentBalance = currency === 'BP' ? player.bp : player.diamond;
    if (currentBalance < price) {
      throw new HttpError(
        400,
        `Saldo ${currency === 'BP' ? 'BP' : 'Diamond'} tidak mencukupi`
      );
    }

    // Simpan dengan transaction:
    // 1. Kurangi saldo bp atau diamond player sesuai currency
    // 2. Buat data PlayerHero dengan currency dan pricePaid
    const [updatedPlayer] = await prisma.$transaction([
      prisma.player.update({
        where: { id: playerId },
        data: {
          [currency === 'BP' ? 'bp' : 'diamond']: { decrement: price },
        },
      }),
      prisma.playerHero.create({
        data: {
          playerId,
          heroId,
          currency: currency as Currency,
          pricePaid: price,
        },
      }),
    ]);

    return res.status(201).json({
      status: true,
      message: 'Hero berhasil dibeli',
      data: {
        hero: {
          id: hero.id,
          name: hero.name,
        },
        currency,
        pricePaid: price,
        balance: {
          bp: updatedPlayer.bp,
          diamond: updatedPlayer.diamond,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
