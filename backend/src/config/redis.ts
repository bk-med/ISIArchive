import { createClient } from 'redis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Too many reconnection attempts, giving up');
        return new Error('Too many reconnection attempts');
      }
      return Math.min(retries * 50, 1000);
    }
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

redisClient.on('end', () => {
  logger.info('Redis Client Disconnected');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Successfully connected to Redis');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Don't throw error, allow app to continue without Redis
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.quit();
});

export { redisClient, connectRedis }; 