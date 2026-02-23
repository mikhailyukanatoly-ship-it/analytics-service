import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

type Row = Record<string, unknown>;

export interface DateRangeRow {
  period_start: string | null;
  period_end: string | null;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly dataSource: DataSource) {}

  // ─── Leaderboard ────────────────────────────────────────────────────────────

  async findLeaderboardRows(whereClause: string, dataParams: unknown[]): Promise<Row[]> {
    const [limitIdx, offsetIdx] = [dataParams.length - 1, dataParams.length];

    return this.dataSource.query(
      `
      WITH account_stats AS (
        SELECT
          a.id                                          AS account_id,
          a.username,
          a.full_name,
          a.is_verified,
          COALESCE(f.followers_count, 0)                AS followers_count,
          COUNT(p.id)                                   AS posts_count,
          COALESCE(SUM(p.comments_count), 0)            AS total_comments
        FROM accounts a
        LEFT JOIN (
          SELECT account_internal_id, MAX(followers_count) AS followers_count
          FROM follower_sources
          GROUP BY account_internal_id
        ) f ON a.internal_id = f.account_internal_id
        LEFT JOIN posts p ON a.id = p.profile_id AND ${whereClause}
        GROUP BY a.id, a.username, a.full_name, a.is_verified, f.followers_count
        HAVING COUNT(p.id) > 0
      )
      SELECT
        account_id,
        username,
        full_name,
        is_verified,
        followers_count,
        posts_count,
        total_comments,
        ROUND((total_comments::numeric / NULLIF(posts_count, 0)::numeric), 2) AS average_comments_per_post,
        CASE
          WHEN followers_count > 0
            THEN (total_comments::numeric / followers_count::numeric) * 1000
          ELSE 0
        END AS normalized_engagement
      FROM account_stats
      ORDER BY normalized_engagement DESC, total_comments DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      dataParams,
    );
  }

  async countLeaderboardTotal(whereClause: string, filterParams: unknown[]): Promise<Row[]> {
    return this.dataSource.query(
      `
      SELECT COUNT(DISTINCT a.id) AS total
      FROM accounts a
      WHERE EXISTS (
        SELECT 1 FROM posts p
        WHERE p.profile_id = a.id AND ${whereClause}
      )
      `,
      filterParams,
    );
  }

  // ─── Best posting time ───────────────────────────────────────────────────────

  async findPostingTimeSlots(whereClause: string, params: unknown[]): Promise<Row[]> {
    return this.dataSource.query(
      `
      SELECT
        EXTRACT(DOW  FROM p.created_time)::integer        AS day_of_week,
        EXTRACT(HOUR FROM p.created_time)::integer        AS hour,
        COUNT(*)                                          AS posts_count,
        AVG(p.comments_count)::numeric(10,2)              AS average_comments,
        SUM(p.comments_count)                             AS total_comments
      FROM posts p
      WHERE ${whereClause}
      GROUP BY day_of_week, hour
      HAVING COUNT(*) >= 3
      ORDER BY average_comments DESC, posts_count DESC
      `,
      params,
    );
  }

  async countPosts(whereClause: string, params: unknown[]): Promise<Row[]> {
    return this.dataSource.query(
      `
      SELECT COUNT(*) AS total_posts
      FROM posts p
      WHERE ${whereClause}
      `,
      params,
    );
  }

  async findPostsPeriod(whereClause: string, params: unknown[]): Promise<DateRangeRow[]> {
    return this.dataSource.query(
      `
      SELECT
        MIN(p.created_time)::text AS period_start,
        MAX(p.created_time)::text AS period_end
      FROM posts p
      WHERE ${whereClause}
      `,
      params,
    );
  }

  // ─── Consistency score ───────────────────────────────────────────────────────

  async findConsistencyRows(whereClause: string, params: unknown[]): Promise<Row[]> {
    return this.dataSource.query(
      `
      WITH post_gaps AS (
        SELECT
          a.id                  AS account_id,
          a.username,
          a.full_name,
          p.created_time,
          LAG(p.created_time) OVER (PARTITION BY a.id ORDER BY p.created_time) AS prev_post_time,
          EXTRACT(EPOCH FROM (
            p.created_time
            - LAG(p.created_time) OVER (PARTITION BY a.id ORDER BY p.created_time)
          )) / 86400            AS gap_days
        FROM accounts a
        INNER JOIN posts p ON a.id = p.profile_id
        WHERE ${whereClause}
      ),
      account_activity AS (
        -- active_days: distinct calendar days with at least one post
        -- total_days:  span from first to last post (min 1 to avoid division by zero)
        SELECT
          account_id,
          COUNT(DISTINCT DATE(created_time))                                      AS active_days,
          GREATEST(
            EXTRACT(EPOCH FROM (MAX(created_time) - MIN(created_time))) / 86400,
            1
          )                                                                       AS total_days
        FROM post_gaps
        GROUP BY account_id
      ),
      account_gaps AS (
        SELECT
          account_id,
          username,
          full_name,
          COUNT(*)                                                            AS posts_count,
          AVG(gap_days)                                                       AS avg_gap_days,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY gap_days)              AS median_gap_days,
          STDDEV(gap_days)                                                    AS gap_std_dev,
          MIN(gap_days)                                                       AS min_gap_days,
          MAX(gap_days)                                                       AS max_gap_days
        FROM post_gaps
        WHERE gap_days IS NOT NULL
        GROUP BY account_id, username, full_name
        HAVING COUNT(*) >= 2
      )
      SELECT
        g.account_id,
        g.username,
        g.full_name,
        g.posts_count,
        COALESCE(g.avg_gap_days::numeric(10,2),    0) AS avg_gap_days,
        COALESCE(g.median_gap_days::numeric(10,2), 0) AS median_gap_days,
        COALESCE(g.gap_std_dev::numeric(10,2),     0) AS gap_std_dev,
        COALESCE(g.min_gap_days::numeric(10,2),    0) AS min_gap_days,
        COALESCE(g.max_gap_days::numeric(10,2),    0) AS max_gap_days,
        ROUND((a.active_days::numeric / a.total_days), 4) AS activity_ratio,
        CASE
          WHEN g.avg_gap_days = 0 OR g.gap_std_dev IS NULL THEN 0
          ELSE GREATEST(0, LEAST(100,
            100 - (g.gap_std_dev / NULLIF(g.avg_gap_days, 0) * 100)
          ))
        END AS consistency_score
      FROM account_gaps g
      INNER JOIN account_activity a ON a.account_id = g.account_id
      ORDER BY consistency_score DESC, g.posts_count DESC
      `,
      params,
    );
  }

  async findConsistencyPeriod(whereClause: string, params: unknown[]): Promise<DateRangeRow[]> {
    return this.dataSource.query(
      `
      SELECT
        MIN(p.created_time)::text AS period_start,
        MAX(p.created_time)::text AS period_end
      FROM posts p
      INNER JOIN accounts a ON a.id = p.profile_id
      WHERE ${whereClause}
      `,
      params,
    );
  }
}
