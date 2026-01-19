import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class DeleteManyInvoicesDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of invoice IDs to delete',
  })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}
