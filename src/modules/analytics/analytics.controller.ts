import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  LeaderboardQueryDto,
  LeaderboardResponseDto,
  BestPostingTimeQueryDto,
  BestPostingTimeResponseDto,
  ConsistencyScoreQueryDto,
  ConsistencyScoreResponseDto,
} from './dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Get top accounts leaderboard',
    description:
      'Returns top accounts ranked by normalized engagement score (comments per 1000 followers). ' +
      'Supports filtering by date range and verified status, with pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard data retrieved successfully',
    type: LeaderboardResponseDto,
  })
  async getLeaderboard(@Query() query: LeaderboardQueryDto): Promise<LeaderboardResponseDto> {
    return this.analyticsService.getLeaderboard(query);
  }

  @Get('best-posting-time')
  @ApiOperation({
    summary: 'Analyze best posting times',
    description:
      'Returns analysis of posting times grouped by day of week and hour, ' +
      'showing average engagement for each time slot.',
  })
  @ApiResponse({
    status: 200,
    description: 'Best posting time analysis retrieved successfully',
    type: BestPostingTimeResponseDto,
  })
  async getBestPostingTime(
    @Query() query: BestPostingTimeQueryDto,
  ): Promise<BestPostingTimeResponseDto> {
    return this.analyticsService.getBestPostingTime(query);
  }

  @Get('consistency-score')
  @ApiOperation({
    summary: 'Get posting consistency scores',
    description:
      'Analyzes posting consistency for accounts by calculating gaps between posts. ' +
      'Returns a composite consistency score (0-100) based on regularity of posting. ' +
      'Can filter by specific account or analyze all accounts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Consistency scores retrieved successfully',
    type: ConsistencyScoreResponseDto,
  })
  async getConsistencyScore(
    @Query() query: ConsistencyScoreQueryDto,
  ): Promise<ConsistencyScoreResponseDto> {
    return this.analyticsService.getConsistencyScore(query);
  }
}
