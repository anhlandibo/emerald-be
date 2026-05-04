import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ConfirmRestoreDto {
  @ApiProperty({
    description: 'Phải gửi true để xác nhận restore (UC37)',
    example: true,
  })
  @IsBoolean()
  confirmed: boolean;
}
