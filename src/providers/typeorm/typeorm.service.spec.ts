import { Logger } from '@nestjs/common';
import { TypeOrmService } from './typeorm.service';

describe('TypeOrmService', () => {
  let service: TypeOrmService;
  let dataSource: { isInitialized: boolean; destroy: jest.Mock };

  beforeEach(() => {
    dataSource = {
      isInitialized: true,
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    service = new TypeOrmService(dataSource as any);

    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined as any);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should do nothing if datasource is not initialized', async () => {
    dataSource.isInitialized = false;

    await service.beforeApplicationShutdown('SIGTERM');

    expect(dataSource.destroy).not.toHaveBeenCalled();
  });

  it('should destroy datasource once and log', async () => {
    await service.beforeApplicationShutdown('SIGTERM');

    expect(dataSource.destroy).toHaveBeenCalledTimes(1);
    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      'App is shutting down due to signal: SIGTERM',
    );
    expect(Logger.prototype.log).toHaveBeenCalledWith('Postgres connection closed gracefully ✅');
  });

  it('should return same closing promise on subsequent calls', async () => {
    const first = service.beforeApplicationShutdown('SIGINT');
    const second = service.beforeApplicationShutdown('SIGINT');

    await Promise.all([first, second]);
    expect(dataSource.destroy).toHaveBeenCalledTimes(1);
  });
});
