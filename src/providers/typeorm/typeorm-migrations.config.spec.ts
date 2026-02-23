import { join } from 'path';

const mockDataSource = jest.fn();

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

jest.mock('typeorm', () => ({
  DataSource: jest.fn().mockImplementation((options) => {
    mockDataSource(options);
    return { options };
  }),
}));

jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    get: (key: string) => {
      const raw = process.env[key];
      if (key === 'DATABASE_PORT') {
        return raw ? Number(raw) : undefined;
      }
      return raw;
    },
  })),
}));

describe('typeorm-migrations.config', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    mockDataSource.mockClear();
    process.env = { ...envBackup };
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it('should throw when DATABASE_HOST is missing', () => {
    delete process.env.DATABASE_HOST;
    process.env.DATABASE_PORT = '5432';
    process.env.DATABASE_USER = 'user';
    process.env.DATABASE_PASSWORD = 'pass';
    process.env.DATABASE_NAME = 'db';

    expect(() => {
      jest.isolateModules(() => {
        const { getDataSourceOptions } = require('./typeorm-migrations.config');
        getDataSourceOptions();
      });
    }).toThrow('DATABASE_HOST is not defined in environment variables');
  });

  it('should throw when DATABASE_PORT is missing', () => {
    process.env.DATABASE_HOST = 'localhost';
    delete process.env.DATABASE_PORT;
    process.env.DATABASE_USER = 'user';
    process.env.DATABASE_PASSWORD = 'pass';
    process.env.DATABASE_NAME = 'db';

    expect(() => {
      jest.isolateModules(() => {
        const { getDataSourceOptions } = require('./typeorm-migrations.config');
        getDataSourceOptions();
      });
    }).toThrow('DATABASE_PORT is not defined in environment variables');
  });

  it('should return DataSourceOptions with env values', () => {
    process.env.DATABASE_HOST = 'localhost';
    process.env.DATABASE_PORT = '5432';
    process.env.DATABASE_USER = 'user';
    process.env.DATABASE_PASSWORD = 'pass';
    process.env.DATABASE_NAME = 'db';

    jest.isolateModules(() => {
      const { getDataSourceOptions } = require('./typeorm-migrations.config');
      const options = getDataSourceOptions();

      expect(options).toMatchObject({
        type: 'postgres',
        schema: 'public',
        logging: true,
        migrationsRun: true,
        migrationsTableName: 'migrations',
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'db',
      });

      expect(options.entities[0]).toBe(
        join(
          process.cwd(),
          'dist',
          'modules',
          'request-logger',
          'entities',
          '**',
          '*.entity.{ts,js}',
        ),
      );
      expect(options.migrations[0]).toBe(join(process.cwd(), 'dist', 'migrations', '**', '*.js'));
    });
  });

  it('should create DataSource with options', () => {
    process.env.DATABASE_HOST = 'localhost';
    process.env.DATABASE_PORT = '5432';
    process.env.DATABASE_USER = 'user';
    process.env.DATABASE_PASSWORD = 'pass';
    process.env.DATABASE_NAME = 'db';

    jest.isolateModules(() => {
      const { appDataSource } = require('./typeorm-migrations.config');
      expect(appDataSource).toBeDefined();
      expect(mockDataSource).toHaveBeenCalledTimes(1);
      expect(mockDataSource.mock.calls[0][0]).toMatchObject({
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'db',
      });
    });
  });
});
