import { INestApplication, Logger } from '@nestjs/common';

const exitHendler = async (app: INestApplication, code: number) => {
  await app.close();
  process.exit(code);
};

export function setupGracefulShutdown(app: INestApplication): void {
  const logger = new Logger('GracefulShutdown');

  // Ловим SIGTERM / SIGINT (например, от Docker или Kubernetes)
  process.on('SIGTERM', async () => {
    logger.warn('SIGTERM received, shutting down...');
    await exitHendler(app, 0);
  });

  process.on('SIGINT', async () => {
    logger.warn('SIGINT received, shutting down...');
    await exitHendler(app, 0);
  });

  // Ловим необработанные исключения Node.js
  process.on('uncaughtException', async (err: Error) => {
    logger.error('Uncaught Exception', err.stack || err.message);
    // здесь можно отправить в Sentry / Datadog / ELK
    await exitHendler(app, 1);
  });

  process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
    logger.error(`Unhandled Rejection at: ${promise}`, reason);
    // здесь тоже логирование/мониторинг
    await exitHendler(app, 1);
  });
}
