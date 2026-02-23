import { Logger } from '@nestjs/common';
import { setupGracefulShutdown } from './graceful-shutdown';

describe('setupGracefulShutdown', () => {
  const handlers = new Map<string, (...args: any[]) => Promise<void>>();
  let app: { close: jest.Mock };
  let onSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    handlers.clear();
    app = { close: jest.fn().mockResolvedValue(undefined) };

    onSpy = jest.spyOn(process, 'on').mockImplementation((event: string, handler: any) => {
      handlers.set(event, handler);
      return process;
    });

    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      return undefined as never;
    }) as any);

    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined as any);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should register all shutdown handlers', () => {
    setupGracefulShutdown(app as any);

    expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
  });

  it('should handle SIGTERM by closing app and exiting', async () => {
    setupGracefulShutdown(app as any);

    await handlers.get('SIGTERM')?.();

    expect(Logger.prototype.warn).toHaveBeenCalledWith('SIGTERM received, shutting down...');
    expect(app.close).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle SIGINT by closing app and exiting', async () => {
    setupGracefulShutdown(app as any);

    await handlers.get('SIGINT')?.();

    expect(Logger.prototype.warn).toHaveBeenCalledWith('SIGINT received, shutting down...');
    expect(app.close).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle uncaughtException by logging and exiting', async () => {
    setupGracefulShutdown(app as any);

    const error = new Error('Boom');
    error.stack = 'stack-trace';

    await handlers.get('uncaughtException')?.(error);

    expect(Logger.prototype.error).toHaveBeenCalledWith('Uncaught Exception', 'stack-trace');
    expect(app.close).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle unhandledRejection by logging and exiting', async () => {
    setupGracefulShutdown(app as any);

    const reason = new Error('Rejected');
    const promise = Promise.resolve('ok');
    await handlers.get('unhandledRejection')?.(reason, promise);

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      `Unhandled Rejection at: ${promise}`,
      reason,
    );
    expect(app.close).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
