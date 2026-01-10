import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { BlockStatus } from '../enums/block-status.enum';

export class UpdateBlockDto {
  @ApiProperty({
    example: 'Emerald A',
    description: 'Name of the block',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Manager name (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  managerName?: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Manager phone number (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  managerPhone?: string;

  @ApiProperty({
    example: 30,
    description: 'Total floors (optional)',
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalFloors?: number;

  @ApiProperty({
    example: BlockStatus.OPERATING,
    description: 'Status of the block',
    enum: BlockStatus,
    required: false,
  })
  @IsEnum(BlockStatus)
  @IsOptional()
  status?: BlockStatus;
}
