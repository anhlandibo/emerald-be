import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ScopeType } from '../../notifications/enums/scope-type.enum';
import { VotingStatus } from '../enums/voting-status.enum';

class OptionResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;
}

class TargetBlockDetailDto {
  @ApiProperty()
  @Expose()
  blockId: number;

  @ApiPropertyOptional()
  @Expose()
  blockName?: string;

  @ApiPropertyOptional()
  @Expose()
  targetFloorNumbers?: number[];
}

export class VotingDetailResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiProperty({ enum: ScopeType })
  @Expose()
  targetScope: ScopeType;

  @ApiProperty()
  @Expose()
  isRequired: boolean;

  @ApiProperty()
  @Expose()
  startTime: Date;

  @ApiProperty()
  @Expose()
  endTime: Date;

  @ApiProperty({ enum: VotingStatus })
  @Expose()
  status: VotingStatus;

  @ApiPropertyOptional({ type: [String] })
  @Expose()
  fileUrls?: string[];

  @ApiProperty({ type: [OptionResponseDto] })
  @Expose()
  @Type(() => OptionResponseDto)
  options: OptionResponseDto[];

  @ApiPropertyOptional({ type: [TargetBlockDetailDto] })
  @Expose()
  @Type(() => TargetBlockDetailDto)
  targetBlocks?: TargetBlockDetailDto[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
