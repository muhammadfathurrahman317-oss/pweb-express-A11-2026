import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../errors/HttpError';
import { Rarity } from '@prisma/client';

export const getAllSkins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
    const heroId = req.query.heroId
      ? parseInt(req.query.heroId as string, 10)
      : undefined;
    const rarity = req.query.rarity as Rarity | undefined;

    const where: any = {};

    if (heroId !== undefined && !isNaN(heroId)) {
      where.heroId = heroId;
    }

    if (rarity) {
      where.rarity = rarity;
    }

    const totalItems = await prisma.skin.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const skins = await prisma.skin.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      include: {
        hero: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data skin',
      data: skins,
      metadata: {
        currentPage: page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSkinDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const skinId = parseInt(req.params.skin_id as string, 10);
    if (isNaN(skinId)) {
      throw new HttpError(404, 'Skin tidak ditemukan');
    }

    const skin = await prisma.skin.findUnique({
      where: { id: skinId },
      include: {
        hero: true,
      },
    });

    if (!skin) {
      throw new HttpError(404, 'Skin tidak ditemukan');
    }

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil detail skin',
      data: skin,
    });
  } catch (error) {
    next(error);
  }
};
