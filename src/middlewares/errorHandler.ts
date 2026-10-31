import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: false,
    message: 'Endpoint tidak ditemukan',
  });
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      status: false,
      message: err.message,
    });
  }

  // Prisma unique constraint error fallback if not caught in controller
  if (err?.code === 'P2002') {
    return res.status(409).json({
      status: false,
      message: 'Data sudah ada (duplikat)',
    });
  }

  // Prisma record not found error fallback
  if (err?.code === 'P2025') {
    return res.status(404).json({
      status: false,
      message: 'Data tidak ditemukan',
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    status: false,
    message: err.message || 'Terjadi kesalahan pada server',
  });
};
