import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class DeleteManyMaintenanceTicketsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of maintenance ticket IDs to delete',
  })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}
