import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ScopeType } from '../../notifications/enums/scope-type.enum';
import { VotingStatus } from '../enums/voting-status.enum';

export class QueryVotingDto {
  @ApiPropertyOptional({ example: 'bảo trì' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: ScopeType.BLOCK, enum: ScopeType })
  @IsEnum(ScopeType)
  @IsOptional()
  targetScope?: ScopeType;

  @ApiPropertyOptional({ example: VotingStatus.ONGOING, enum: VotingStatus })
  @IsEnum(VotingStatus)
  @IsOptional()
  status?: VotingStatus;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}
