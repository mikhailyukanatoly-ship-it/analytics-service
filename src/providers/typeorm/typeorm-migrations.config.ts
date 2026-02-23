import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource, type DataSourceOptions } from 'typeorm';

config({ path: join(process.cwd(), '.env') });
const configService = new ConfigService();

export const getDataSourceOptions = (): DataSourceOptions => {
  const host = configService.get<string>('DATABASE_HOST');
  if (!host) throw new Error('DATABASE_HOST is not defined in environment variables');

  const port = configService.get<number>('DATABASE_PORT');
  if (!port) throw new Error('DATABASE_PORT is not defined in environment variables');

  const username = configService.get<string>('DATABASE_USER');
  if (!username) throw new Error('DATABASE_USER is not defined in environment variables');

  const password = configService.get<string>('DATABASE_PASSWORD');
  if (!password) throw new Error('DATABASE_PASSWORD is not defined in environment variables');

  const database = configService.get<string>('DATABASE_NAME');
  if (!database) throw new Error('DATABASE_NAME is not defined in environment variables');

  return {
    type: 'postgres',
    schema: 'public',
    logging: true,
    entities: [
      join(process.cwd(), 'dist', 'modules', 'analytics', 'entities', '**', '*.entity.{ts,js}'),
    ],

    migrations: [join(process.cwd(), 'dist', 'migrations', '**', '*.js')],

    migrationsRun: true,
    migrationsTableName: 'migrations',

    host,
    port,
    username,
    password,
    database,
  };
};

export const appDataSource = new DataSource(getDataSourceOptions());
