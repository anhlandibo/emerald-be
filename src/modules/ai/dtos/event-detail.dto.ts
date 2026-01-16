import { ApiProperty } from '@nestjs/swagger';

export class EventDetailDto {
  @ApiProperty({ example: 'Cúp điện' })
  event_name: string;

  @ApiProperty({ example: '14:00 - 16:00, ngày 16/01/2026' })
  time: string;

  @ApiProperty({ example: 'Tòa A, Tầng 1-5' })
  location: string;

  @ApiProperty({ example: 'Vui lòng chuẩn bị nước sạch' })
  note: string;
}
