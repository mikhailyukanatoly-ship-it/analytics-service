import { IsOptional, IsDateString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for analytics period (ISO 8601)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics period (ISO 8601)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by verified accounts only',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Number of results to skip',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class LeaderboardItemDto {
  @ApiProperty({ description: 'Account ID' })
  accountId: string;

  @ApiProperty({ description: 'Account username' })
  username: string;

  @ApiProperty({ description: 'Account full name' })
  fullName: string;

  @ApiProperty({ description: 'Whether account is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Number of followers' })
  followersCount: number;

  @ApiProperty({ description: 'Total number of posts' })
  postsCount: number;

  @ApiProperty({ description: 'Total comments received' })
  totalComments: number;

  @ApiProperty({ description: 'Average comments per post' })
  averageCommentsPerPost: number;

  @ApiProperty({ description: 'Normalized engagement score (comments per 1000 followers)' })
  normalizedEngagement: number;
}

export class LeaderboardResponseDto {
  @ApiProperty({ type: [LeaderboardItemDto] })
  data: LeaderboardItemDto[];

  @ApiProperty({ description: 'Total number of accounts matching criteria' })
  total: number;

  @ApiProperty({ description: 'Number of results returned' })
  limit: number;

  @ApiProperty({ description: 'Number of results skipped' })
  offset: number;
}
