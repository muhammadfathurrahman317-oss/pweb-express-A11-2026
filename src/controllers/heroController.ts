import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../errors/HttpError';
import { Role, Lane } from '@prisma/client';

export const getAllHeroes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
    const search = req.query.search as string | undefined;
    const role = req.query.role as Role | undefined;

    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (role) {
      where.role = role;
    }

    const totalItems = await prisma.hero.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const heroes = await prisma.hero.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'asc' },
    });

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data hero',
      data: heroes,
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

export const getHeroDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const heroId = parseInt(req.params.hero_id as string, 10);
    if (isNaN(heroId)) {
      throw new HttpError(404, 'Hero tidak ditemukan');
    }

    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      include: {
        skins: true,
      },
    });

    if (!hero) {
      throw new HttpError(404, 'Hero tidak ditemukan');
    }

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil detail hero',
      data: hero,
    });
  } catch (error) {
    next(error);
  }
};

export const createHero = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, role, lane, releaseYear, priceBP, priceDiamond } = req.body;

    // 1. name, role, lane, atau releaseYear tidak diisi -> 400
    if (!name || !role || !lane || releaseYear === undefined || releaseYear === null) {
      throw new HttpError(
        400,
        'Field name, role, lane, dan releaseYear wajib diisi'
      );
    }

    // 2. Nama hero sudah ada -> 409
    const existingHero = await prisma.hero.findUnique({
      where: { name: name.trim() },
    });

    if (existingHero) {
      throw new HttpError(409, 'Hero dengan nama tersebut sudah ada');
    }

    // 3. Berhasil -> 201 berisi hero baru
    const newHero = await prisma.hero.create({
      data: {
        name: name.trim(),
        role: role as Role,
        lane: lane as Lane,
        releaseYear: Number(releaseYear),
        priceBP: priceBP !== undefined && priceBP !== null ? Number(priceBP) : null,
        priceDiamond:
          priceDiamond !== undefined && priceDiamond !== null
            ? Number(priceDiamond)
            : null,
      },
    });

    return res.status(201).json({
      status: true,
      message: 'Hero berhasil dibuat',
      data: newHero,
    });
  } catch (error) {
    next(error);
  }
};
