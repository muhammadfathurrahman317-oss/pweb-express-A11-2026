import express from 'express';
import { logger } from './middlewares/logger';
import { notFound, errorHandler } from './middlewares/errorHandler';
import heroRoutes from './routes/heroRoutes';
import skinRoutes from './routes/skinRoutes';
import playerRoutes from './routes/playerRoutes';
import statisticRoutes from './routes/statisticRoutes';

const app = express();

app.use(express.json());
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  return res.status(200).json({
    status: true,
    message: 'Server MLBB Shop berjalan dengan baik',
  });
});

// API routes
app.use('/api/heroes', heroRoutes);
app.use('/api/skins', skinRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/statistics', statisticRoutes);

// 404 handler for undefined routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;
