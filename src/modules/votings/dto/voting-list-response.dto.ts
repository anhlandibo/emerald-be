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
}
