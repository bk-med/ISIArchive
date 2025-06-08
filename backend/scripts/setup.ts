#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { logger } from '../src/config/logger';

const runCommand = (command: string, description: string) => {
  try {
    logger.info(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    logger.info(`✅ ${description} completed successfully`);
  } catch (error) {
    logger.error(`❌ ${description} failed:`, error);
    process.exit(1);
  }
};

const setup = async () => {
  logger.info('🚀 Starting ISI Archive database setup...');

  // Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client');

  // Push database schema
  runCommand('npx prisma db push', 'Pushing database schema');

  // Seed the database
  runCommand('npx prisma db seed', 'Seeding database with initial data');

  logger.info('🎉 Database setup completed successfully!');
  logger.info('');
  logger.info('Default admin credentials:');
  logger.info('Email: admin@isi.tn');
  logger.info('Password: admin123');
  logger.info('');
  logger.info('Default professor credentials:');
  logger.info('Email: prof@isi.tn');
  logger.info('Password: prof123');
  logger.info('');
  logger.info('You can now start the server with: npm run dev');
};

setup().catch((error) => {
  logger.error('Setup failed:', error);
  process.exit(1);
}); 