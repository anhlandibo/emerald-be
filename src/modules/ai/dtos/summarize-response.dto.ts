import { ApiProperty } from '@nestjs/swagger';
import { EventDetailDto } from './event-detail.dto';

export class SummarizeResponseDto {
  @ApiProperty({
    type: [EventDetailDto],
    description: 'Danh sách các sự kiện được trích xuất',
  })
  events: EventDetailDto[];

  @ApiProperty({ example: 2500 })
  original_length: number;

  @ApiProperty({ example: 'success' })
  status: string;
}
