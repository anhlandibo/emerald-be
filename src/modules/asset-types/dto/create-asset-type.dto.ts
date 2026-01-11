import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAssetTypeDto {
  @ApiProperty({
    example: 'Camera giám sát',
    description: 'Name of the asset type',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Camera an ninh cho hành lang và khu vực chung',
    description: 'Description of the asset type',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
