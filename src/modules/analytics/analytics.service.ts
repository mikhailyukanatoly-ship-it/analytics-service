import { Injectable, Logger } from '@nestjs/common';
import {
  LeaderboardQueryDto,
  LeaderboardResponseDto,
  LeaderboardItemDto,
  BestPostingTimeQueryDto,
  BestPostingTimeResponseDto,
  TimeSlotDto,
  ConsistencyScoreQueryDto,
  ConsistencyScoreResponseDto,
  AccountConsistencyDto,
} from './dto';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  constructor(private readonly repository: AnalyticsRepository) {}

  async getLeaderboard(query: LeaderboardQueryDto): Promise<LeaderboardResponseDto> {
    const { startDate, endDate, verified, limit = 10, offset = 0 } = query;

    const filterParams: unknown[] = [];
    const conditions = this.buildDateFilter('p', startDate, endDate, filterParams);

    if (verified !== undefined) {
      filterParams.push(verified);
      conditions.push(`a.is_verified = $${filterParams.length}`);
    }

    const whereClause = conditions.length ? conditions.join(' AND ') : 'TRUE';

    // Append limit/offset after filters so their placeholder indices are stable
    const dataParams = [...filterParams];
    dataParams.push(limit);
    const limitPlaceholder = dataParams.length;
    dataParams.push(offset);
    const offsetPlaceholder = dataParams.length;

    const [rows, countRows] = await Promise.all([
      this.repository.findLeaderboardRows(whereClause, dataParams),
      this.repository.countLeaderboardTotal(whereClause, filterParams),
    ]);

    const data: LeaderboardItemDto[] = rows.map((row) => ({
      accountId: row.account_id as string,
      username: row.username as string,
      fullName: row.full_name as string,
      isVerified: row.is_verified as boolean,
      followersCount: parseInt(row.followers_count as string, 10),
      postsCount: parseInt(row.posts_count as string, 10),
      totalComments: parseInt(row.total_comments as string, 10),
      averageCommentsPerPost: parseFloat(row.average_comments_per_post as string),
      normalizedEngagement: parseFloat(row.normalized_engagement as string),
    }));

    // Suppress TS unused-variable warning — placeholders are used inside the SQL template
    void limitPlaceholder;
    void offsetPlaceholder;

    return {
      data,
      total: parseInt((countRows[0]?.total as string) || '0', 10),
      limit,
      offset,
    };
  }

  async getBestPostingTime(query: BestPostingTimeQueryDto): Promise<BestPostingTimeResponseDto> {
    const { startDate, endDate, profileId } = query;

    const params: unknown[] = [];
    const conditions = this.buildDateFilter('p', startDate, endDate, params);

    if (profileId) {
      params.push(profileId);
      conditions.push(`p.profile_id = $${params.length}`);
    }

    const whereClause = conditions.length ? conditions.join(' AND ') : 'TRUE';

    const [slots, countRows, periodRows] = await Promise.all([
      this.repository.findPostingTimeSlots(whereClause, params),
      this.repository.countPosts(whereClause, params),
      this.repository.findPostsPeriod(whereClause, params),
    ]);

    const data: TimeSlotDto[] = slots.map((row) => ({
      dayOfWeek: parseInt(row.day_of_week as string, 10),
      dayName: this.dayNames[parseInt(row.day_of_week as string, 10)],
      hour: parseInt(row.hour as string, 10),
      postsCount: parseInt(row.posts_count as string, 10),
      averageComments: parseFloat(row.average_comments as string),
      totalComments: parseInt(row.total_comments as string, 10),
    }));

    return {
      data,
      totalPosts: parseInt((countRows[0]?.total_posts as string) || '0', 10),
      periodStart: periodRows[0]?.period_start || startDate || '',
      periodEnd: periodRows[0]?.period_end || endDate || '',
    };
  }

  async getConsistencyScore(query: ConsistencyScoreQueryDto): Promise<ConsistencyScoreResponseDto> {
    const { startDate, endDate, accountId } = query;

    const params: unknown[] = [];
    const conditions = this.buildDateFilter('p', startDate, endDate, params);

    if (accountId) {
      params.push(accountId);
      conditions.push(`a.id = $${params.length}`);
    }

    const whereClause = conditions.length ? conditions.join(' AND ') : 'TRUE';

    const [rows, periodRows] = await Promise.all([
      this.repository.findConsistencyRows(whereClause, params),
      this.repository.findConsistencyPeriod(whereClause, params),
    ]);

    const data: AccountConsistencyDto[] = rows.map((row) => ({
      accountId: row.account_id as string,
      username: row.username as string,
      fullName: row.full_name as string,
      // CTE counts gap rows (= posts - 1), so +1 restores the actual post count
      postsCount: parseInt(row.posts_count as string, 10) + 1,
      averageGapDays: parseFloat(row.avg_gap_days as string),
      medianGapDays: parseFloat(row.median_gap_days as string),
      gapStdDev: parseFloat(row.gap_std_dev as string),
      minGapDays: parseFloat(row.min_gap_days as string),
      maxGapDays: parseFloat(row.max_gap_days as string),
      activityRatio: parseFloat(row.activity_ratio as string),
      consistencyScore: parseFloat(row.consistency_score as string),
    }));

    return {
      data,
      total: data.length,
      periodStart: periodRows[0]?.period_start || startDate || '',
      periodEnd: periodRows[0]?.period_end || endDate || '',
    };
  }

  // ─── helpers ──────────────────────────────────────────────────────────────────

  /**
   * Appends date-range conditions to `params` (mutates it) and returns the
   * generated SQL condition strings.
   *
   * @param alias  Table alias prefix, e.g. `'p'` → `p.created_time`.
   *               Pass `''` when querying without a table alias.
   */
  private buildDateFilter(
    alias: string,
    startDate: string | undefined,
    endDate: string | undefined,
    params: unknown[],
  ): string[] {
    const col = alias ? `${alias}.created_time` : 'created_time';
    const conditions: string[] = [];

    if (startDate) {
      params.push(startDate);
      conditions.push(`${col} >= $${params.length}::timestamp`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`${col} <= $${params.length}::timestamp`);
    }

    return conditions;
  }
}
