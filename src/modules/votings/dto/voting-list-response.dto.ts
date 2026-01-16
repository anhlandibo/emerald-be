import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ScopeType } from '../../notifications/enums/scope-type.enum';
import { VotingStatus } from '../enums/voting-status.enum';

export class VotingListResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty({
    enum: ['Toàn chung cư', 'Theo tòa', 'Theo tầng'],
    example: 'Toàn chung cư',
    description: 'Phạm vi áp dụng của cuộc bỏ phiếu',
  })
  @Expose()
  scopeDisplay: string;

  @ApiProperty()
  @Expose()
  startTime: Date;

  @ApiProperty()
  @Expose()
  isRequired: boolean;

  @ApiProperty({ enum: VotingStatus })
  @Expose()
  status: VotingStatus;

  @ApiPropertyOptional()
  @Expose()
  leadingOption?: string;

  @ApiProperty({
    type: Number,
    description: 'Số cư dân đủ điều kiện bỏ phiếu',
    example: 120,
  })
  @Expose()
  totalEligibleVoters: number;

  @ApiProperty({
    type: Number,
    description: 'Số cư dân đã bỏ phiếu',
    example: 85,
  })
  @Expose()
  totalVotesCast: number;

  @ApiProperty({
    type: String,
    description: 'Tỷ lệ bỏ phiếu dưới dạng "85/120"',
    example: '85/120',
  })
  @Expose()
  votingRatio: string;

  @ApiProperty({
    type: Number,
    description: 'Tỷ lệ phần trăm bỏ phiếu',
    example: 70.83,
  })
  @Expose()
  votingPercentage: number;
}
