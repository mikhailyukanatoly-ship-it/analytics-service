import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BestPostingTimeQueryDto {
  @ApiPropertyOptional({
    description:
      'Profile (account) ID to analyze. Identifies when a given profile gets strongest engagement.',
    example: '100063695660293',
  })
  @IsOptional()
  @IsString()
  profileId?: string;

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
}

export class TimeSlotDto {
  @ApiProperty({ description: 'Day of week (0=Sunday, 1=Monday, ...)', example: 1 })
  dayOfWeek: number;

  @ApiProperty({ description: 'Day of week name', example: 'Monday' })
  dayName: string;

  @ApiProperty({ description: 'Hour of day (0-23)', example: 14 })
  hour: number;

  @ApiProperty({ description: 'Number of posts in this time slot' })
  postsCount: number;

  @ApiProperty({ description: 'Average comments per post' })
  averageComments: number;

  @ApiProperty({ description: 'Total comments in this time slot' })
  totalComments: number;
}

export class BestPostingTimeResponseDto {
  @ApiProperty({ type: [TimeSlotDto] })
  data: TimeSlotDto[];

  @ApiProperty({ description: 'Total number of posts analyzed' })
  totalPosts: number;

  @ApiProperty({ description: 'Analysis period start date' })
  periodStart: string;

  @ApiProperty({ description: 'Analysis period end date' })
  periodEnd: string;
}
