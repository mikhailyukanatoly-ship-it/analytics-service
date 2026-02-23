import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataImportService } from './data-import.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('DataImportCommand');

  logger.log('🚀 Starting data import CLI...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const importService = app.get(DataImportService);
    await importService.importAll();
    logger.log('✨ Import completed successfully');
  } catch (error) {
    logger.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }

  process.exit(0);
}

bootstrap();
