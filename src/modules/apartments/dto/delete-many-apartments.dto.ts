import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteManyApartmentsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of apartment IDs to delete',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}
