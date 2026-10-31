import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const getStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalPlayers = await prisma.player.count();
    const totalHeroesOwned = await prisma.playerHero.count();

    const diamondAgg = await prisma.player.aggregate({
      _sum: {
        diamond: true,
      },
    });
    const totalDiamond = diamondAgg._sum.diamond ?? 0;

    const groupedHeroes = await prisma.playerHero.groupBy({
      by: ['heroId'],
      _count: {
        heroId: true,
      },
      orderBy: [
        {
          _count: {
            heroId: 'desc',
          },
        },
        {
          heroId: 'asc',
        },
      ],
      take: 1,
    });

    let mostOwnedHero: { heroId: number; name: string; owners: number } | null =
      null;

    if (groupedHeroes.length > 0) {
      const topHeroId = groupedHeroes[0].heroId;
      const hero = await prisma.hero.findUnique({
        where: { id: topHeroId },
        select: { name: true },
      });

      mostOwnedHero = {
        heroId: topHeroId,
        name: hero?.name || '',
        owners: groupedHeroes[0]._count.heroId,
      };
    }

    const roleGroups = await prisma.hero.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
      orderBy: {
        _count: {
          role: 'desc',
        },
      },
    });

    const heroesPerRole = roleGroups.map((rg) => ({
      role: rg.role,
      total: rg._count.role,
    }));

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil statistik',
      data: {
        totalPlayers,
        totalHeroesOwned,
        totalDiamond,
        mostOwnedHero,
        heroesPerRole,
      },
    });
  } catch (error) {
    next(error);
  }
};
