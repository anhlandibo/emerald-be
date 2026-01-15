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

class VotedOptionDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;
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

export class VotingMyVotingResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiProperty()
  @Expose()
  startTime: Date;

  @ApiProperty()
  @Expose()
  endTime: Date;

  @ApiProperty()
  @Expose()
  isRequired: boolean;

  @ApiProperty({ enum: VotingStatus })
  @Expose()
  status: VotingStatus;

  @ApiProperty({ enum: ScopeType })
  @Expose()
  targetScope: ScopeType;

  @ApiPropertyOptional({ type: [TargetBlockDetailDto] })
  @Expose()
  @Type(() => TargetBlockDetailDto)
  targetBlocks?: TargetBlockDetailDto[];

  @ApiPropertyOptional({ type: [String] })
  @Expose()
  fileUrls?: string[];

  @ApiProperty()
  @Expose()
  votingArea: number;

  @ApiPropertyOptional({ type: () => VotedOptionDto })
  @Expose()
  @Type(() => VotedOptionDto)
  votedOption?: VotedOptionDto;

  @ApiProperty({ type: [OptionResponseDto] })
  @Expose()
  @Type(() => OptionResponseDto)
  options: OptionResponseDto[];
}
