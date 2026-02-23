import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsistencyScoreQueryDto {
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
    description: 'Specific account ID to analyze',
    example: '100063695660293',
  })
  @IsOptional()
  @IsString()
  accountId?: string;
}

export class AccountConsistencyDto {
  @ApiProperty({ description: 'Account ID' })
  accountId: string;

  @ApiProperty({ description: 'Account username' })
  username: string;

  @ApiProperty({ description: 'Account full name' })
  fullName: string;

  @ApiProperty({ description: 'Total number of posts' })
  postsCount: number;

  @ApiProperty({ description: 'Average days between posts' })
  averageGapDays: number;

  @ApiProperty({ description: 'Median days between posts (percentile_cont 0.5)' })
  medianGapDays: number;

  @ApiProperty({ description: 'Standard deviation of gaps between posts (days)' })
  gapStdDev: number;

  @ApiProperty({ description: 'Minimum days between posts' })
  minGapDays: number;

  @ApiProperty({ description: 'Maximum days between posts' })
  maxGapDays: number;

  @ApiProperty({
    description:
      'Ratio of days with at least one post to the total span of the period (0–1). ' +
      'Higher value means the account posted on more distinct days.',
  })
  activityRatio: number;

  @ApiProperty({ description: 'Consistency score (0-100, higher is more consistent)' })
  consistencyScore: number;
}

export class ConsistencyScoreResponseDto {
  @ApiProperty({ type: [AccountConsistencyDto] })
  data: AccountConsistencyDto[];

  @ApiProperty({ description: 'Total number of accounts analyzed' })
  total: number;

  @ApiProperty({ description: 'Analysis period start date' })
  periodStart: string;

  @ApiProperty({ description: 'Analysis period end date' })
  periodEnd: string;
}
