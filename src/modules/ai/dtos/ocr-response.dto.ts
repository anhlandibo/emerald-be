import { ApiProperty } from '@nestjs/swagger';

export class OcrResponseDto {
  @ApiProperty({ example: '123456.78', nullable: true })
  meter_reading: string | null;

  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Đọc chỉ số thành công' })
  message: string;
}
