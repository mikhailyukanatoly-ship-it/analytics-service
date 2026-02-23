import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors';
import { setupGracefulShutdown } from './utils';

const DEFAULT_PORT = 3001;
const OPENAPI_DOCS_TITLE = 'Analytics Service API';
const OPENAPI_DOCS_VERSION = '0.1';
const OPENAPI_DOCS_URL_PATH = 'api/docs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT', DEFAULT_PORT);

  app.setGlobalPrefix('api');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TimeoutInterceptor(reflector, 30000));

  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  const config = new DocumentBuilder()
    .setTitle(OPENAPI_DOCS_TITLE)
    .setVersion(OPENAPI_DOCS_VERSION)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(OPENAPI_DOCS_URL_PATH, app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  setupGracefulShutdown(app);

  await app.listen(PORT);

  logger.log(`
    ===================================================================================
      ${configService.get<string>('NAME')} backend is now running. 
      App is running on port ${PORT}.
      Database connection: ${configService.get<string>('DATABASE_NAME')}.
      Swagger docs available at http://localhost:${PORT}/api/docs
    ===================================================================================`);
}

void bootstrap();
