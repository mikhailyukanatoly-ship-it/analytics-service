import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TypeOrmService implements BeforeApplicationShutdown {
  private readonly logger = new Logger(TypeOrmService.name);
  private closing?: Promise<void>;

  constructor(private readonly dataSource: DataSource) {}

  async beforeApplicationShutdown(signal?: string) {
    this.logger.warn(`App is shutting down due to signal: ${signal}`);

    if (!this.dataSource?.isInitialized) return;
    if (this.closing) return this.closing;

    this.closing = this.dataSource.destroy().then(() => {
      this.logger.log('Postgres connection closed gracefully ✅');
    });

    return this.closing;
  }
}
