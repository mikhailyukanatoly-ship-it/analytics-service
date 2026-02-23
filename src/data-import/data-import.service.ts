import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createReadStream, readFileSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { parse } from 'csv-parse/sync';
import * as copyStreams from 'pg-copy-streams';

interface AccountRecord {
  id?: string;
  username?: string;
  full_name?: string;
  description?: string;
  is_verified?: string;
  restricted?: string;
  _id?: number;
  _status?: string;
  id_alt?: string;
}

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(private dataSource: DataSource) {}

  async importAll(): Promise<void> {
    this.logger.log('Starting data import from CSV files...');

    // Idempotency check — skip if data already exists
    const [{ count }] = await this.dataSource.query('SELECT COUNT(*) FROM accounts');
    if (parseInt(count, 10) > 0) {
      this.logger.log('⏭️  Data already imported, skipping.');
      return;
    }

    try {
      await this.importAccounts();
      await this.importPosts();
      await this.importFollowerSources();
      this.logger.log('✅ All data imported successfully!');
    } catch (error) {
      this.logger.error('❌ Error during import:', error);
      throw error;
    }
  }

  async importAccounts(): Promise<void> {
    const filePath = join(process.cwd(), 'assets', 'accounts.csv');
    this.logger.log(`Importing accounts from ${filePath}...`);

    // accounts.csv has complex multiline quoted fields that PostgreSQL COPY cannot
    // handle natively, so we parse with csv-parse and stream the cleaned rows into
    // the table via COPY FROM STDIN using pg-copy-streams — one connection, one TX.
    const fileContent = readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      skip_records_with_error: true,
      cast: (value, context) => {
        if (context.column === 'is_verified') {
          return value === 'True' || value === 'true' ? 't' : 'f';
        }
        if (context.column === '_id') {
          return parseInt(value, 10) || null;
        }
        if (value === 'NULL' || value === 'null' || value === '') {
          return null;
        }
        return value;
      },
    }) as AccountRecord[];

    this.logger.log(`Parsed ${records.length} accounts from CSV`);

    // Build tab-delimited text buffer for COPY FROM STDIN (PostgreSQL text format)
    const validRecords = records.filter((r) => r.id);
    const csvLines = validRecords
      .map((r) =>
        [
          this.escapeTsvField(r.id),
          this.escapeTsvField(r.username),
          this.escapeTsvField(r.full_name),
          this.escapeTsvField(r.description),
          r.is_verified === 't' ? 't' : 'f',
          this.escapeTsvField(r.restricted),
          r._id ?? '\\N',
          this.escapeTsvField(r._status),
          this.escapeTsvField(r.id_alt),
          'Facebook',
        ].join('\t'),
      )
      .join('\n');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.startTransaction();

      // databaseConnection exposes the raw pg.Client needed by pg-copy-streams.
      // TypeORM does not provide a public API for this; property name is stable in v0.3.x.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = (queryRunner as any).databaseConnection;

      const copyQuery = `COPY accounts (id, username, full_name, description, is_verified, restricted, internal_id, status, id_alt, type) FROM STDIN WITH (FORMAT text, NULL '\\N')`;
      const copyStream = client.query(copyStreams.from(copyQuery));

      await pipeline(Readable.from([csvLines]), copyStream);

      await queryRunner.commitTransaction();
      this.logger.log(`✅ Imported ${validRecords.length} accounts`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async importPosts(): Promise<void> {
    const filePath = join(process.cwd(), 'assets', 'posts.csv');
    this.logger.log(`Importing posts from ${filePath}...`);

    // posts.csv is clean CSV — stream directly from disk into a temp table,
    // then INSERT only rows with a matching profile_id to honour the FK.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.startTransaction();

      // databaseConnection exposes the raw pg.Client needed by pg-copy-streams.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = (queryRunner as any).databaseConnection;

      await queryRunner.query(`
        CREATE TEMP TABLE temp_posts (
          id             TEXT,
          created_time   TEXT,
          profile_id     TEXT,
          text_original  TEXT,
          comments_count INTEGER
        ) ON COMMIT DROP
      `);

      const copyStream = client.query(
        copyStreams.from(
          `COPY temp_posts (id, created_time, profile_id, text_original, comments_count) FROM STDIN WITH (FORMAT csv, HEADER true, NULL 'NULL')`,
        ),
      );
      await pipeline(createReadStream(filePath), copyStream);

      const result = await queryRunner.query(`
        INSERT INTO posts (id, created_time, profile_id, text_original, comments_count)
        SELECT
          tp.id,
          tp.created_time::timestamptz,
          tp.profile_id,
          tp.text_original,
          COALESCE(tp.comments_count, 0)
        FROM temp_posts tp
        INNER JOIN accounts a ON a.id = tp.profile_id
        WHERE tp.id IS NOT NULL AND tp.id <> ''
        RETURNING id
      `);

      await queryRunner.commitTransaction();
      this.logger.log(`✅ Imported ${result.length} posts`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async importFollowerSources(): Promise<void> {
    const filePath = join(process.cwd(), 'assets', 'sources_for_followers.csv');
    this.logger.log(`Importing follower sources from ${filePath}...`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.startTransaction();

      // databaseConnection exposes the raw pg.Client needed by pg-copy-streams.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = (queryRunner as any).databaseConnection;

      await queryRunner.query(`
        CREATE TEMP TABLE temp_follower_sources (
          _id             INTEGER,
          followers_count INTEGER
        ) ON COMMIT DROP
      `);

      const copyStream = client.query(
        copyStreams.from(
          `COPY temp_follower_sources (_id, followers_count) FROM STDIN WITH (FORMAT csv, HEADER true, NULL 'NULL')`,
        ),
      );
      await pipeline(createReadStream(filePath), copyStream);

      const result = await queryRunner.query(`
        INSERT INTO follower_sources (account_internal_id, followers_count)
        SELECT _id, followers_count
        FROM temp_follower_sources
        WHERE _id IS NOT NULL
        RETURNING account_internal_id
      `);

      await queryRunner.commitTransaction();
      this.logger.log(`✅ Imported ${result.length} follower sources`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── helpers ─────────────────────────────────────────────────────────────────

  /** Escapes a value for PostgreSQL text-format COPY (tab-delimited). */
  private escapeTsvField(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '\\N';
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }
}
