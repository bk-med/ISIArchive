"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const prisma = globalThis.__prisma || new client_1.PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
});
exports.prisma = prisma;
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger_1.logger.debug('Query: ' + e.query);
        logger_1.logger.debug('Params: ' + e.params);
        logger_1.logger.debug('Duration: ' + e.duration + 'ms');
    });
}
prisma.$on('error', (e) => {
    logger_1.logger.error('Database error:', e);
});
if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = prisma;
}
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=database.js.map