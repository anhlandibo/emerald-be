import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BlockStatus } from '../enums/block-status.enum';

export class QueryBlockDto {
  @ApiProperty({
    description: 'Search by name',
    required: false,
    example: 'Emerald',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by status',
    required: false,
    enum: BlockStatus,
    example: BlockStatus.OPERATING,
  })
  @IsOptional()
  @IsEnum(BlockStatus)
  status?: BlockStatus;
}
