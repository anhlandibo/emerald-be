import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class VerifyMeterReadingDto {
  @ApiProperty({
    example: 1,
    description: 'ID của meter reading cần verify',
  })
  @IsInt()
  @IsNotEmpty()
  meterReadingId: number;
}
