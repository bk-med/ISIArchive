"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
const logger_1 = require("./logger");
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = (0, redis_1.createClient)({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger_1.logger.error('Redis: Too many reconnection attempts, giving up');
                return new Error('Too many reconnection attempts');
            }
            return Math.min(retries * 50, 1000);
        }
    }
});
exports.redisClient = redisClient;
redisClient.on('error', (err) => {
    logger_1.logger.error('Redis Client Error:', err);
});
redisClient.on('connect', () => {
    logger_1.logger.info('Redis Client Connected');
});
redisClient.on('ready', () => {
    logger_1.logger.info('Redis Client Ready');
});
redisClient.on('end', () => {
    logger_1.logger.info('Redis Client Disconnected');
});
const connectRedis = async () => {
    try {
        await redisClient.connect();
        logger_1.logger.info('Successfully connected to Redis');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to Redis:', error);
    }
};
exports.connectRedis = connectRedis;
process.on('SIGINT', async () => {
    await redisClient.quit();
});
//# sourceMappingURL=redis.js.map