import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

import { TypeOrmService } from './typeorm.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DATABASE_HOST'),
        port: configService.getOrThrow<number>('DATABASE_PORT'),
        username: configService.getOrThrow<string>('DATABASE_USER'),
        password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
        database: configService.getOrThrow<string>('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations',
        maxQueryExecutionTime: 5000,
        logging: true,
        extra: {
          max: 20,
          idleTimeoutMillis: 5000,
          connectionTimeoutMillis: configService.get<number>('LONG_REQUEST_TIMEOUT', 2000),
        },
      }),
    }),
  ],
  providers: [TypeOrmService],
  exports: [TypeOrmModule],
})
export class TypeormModule {}
