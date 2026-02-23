import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors';
import { envValidationSchema } from './config/env-validation';
import { AllExceptionFilter } from './core/exceptions/exception.filter';
import { ExceptionsModule } from './core/exceptions/exceptions.module';
import { TypeormModule } from './providers/typeorm';
import { DataImportModule } from './data-import/data-import.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

const interceptorProviders = [LoggingInterceptor].map((interceptor) => ({
  provide: APP_INTERCEPTOR,
  useClass: interceptor,
}));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeormModule,
    ExceptionsModule,
    DataImportModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    ...interceptorProviders,
  ],
})
export class AppModule {}
