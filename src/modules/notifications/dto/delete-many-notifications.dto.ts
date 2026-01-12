import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class DeleteManyNotificationsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of notification IDs to delete',
  })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}
