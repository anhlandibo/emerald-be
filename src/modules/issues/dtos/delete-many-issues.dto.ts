import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteManyIssuesDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of issue IDs to delete (soft delete)',
    type: [Number],
  })
  @IsArray({ message: 'IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one ID is required' })
  @IsInt({ each: true, message: 'Each ID must be an integer' })
  @Type(() => Number)
  ids: number[];
}
