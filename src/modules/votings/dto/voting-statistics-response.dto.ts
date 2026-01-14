import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { VotingStatus } from '../enums/voting-status.enum';

class VotingOptionResultDto {
  @ApiProperty()
  @Expose()
  optionId: number;

  @ApiProperty()
  @Expose()
  optionName: string;

  @ApiProperty()
  @Expose()
  totalArea: number;

  @ApiProperty()
  @Expose()
  voteCount: number;

  @ApiProperty()
  @Expose()
  percentage: number;
}

export class VotingStatisticsResponseDto {
  @ApiProperty()
  @Expose()
  votingId: number;

  @ApiProperty()
  @Expose()
  votingTitle: string;

  @ApiProperty({ enum: VotingStatus })
  @Expose()
  status: VotingStatus;

  @ApiProperty()
  @Expose()
  totalEligibleArea: number;

  @ApiProperty()
  @Expose()
  votedArea: number;

  @ApiProperty()
  @Expose()
  participationRate: number;

  @ApiProperty({ type: [VotingOptionResultDto] })
  @Expose()
  @Type(() => VotingOptionResultDto)
  results: VotingOptionResultDto[];
}
