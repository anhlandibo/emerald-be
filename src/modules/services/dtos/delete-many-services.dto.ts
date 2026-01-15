import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteManyServicesDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Danh sách ID dịch vụ cần xóa',
    type: [Number],
  })
  @IsArray({ message: 'IDs phải là một mảng' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 ID để xóa' })
  @IsInt({ each: true, message: 'Mỗi ID phải là một số nguyên' })
  @Type(() => Number)
  ids: number[];
}
