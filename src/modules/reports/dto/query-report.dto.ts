import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class QueryReportDto {
  @ApiProperty({
    type: String,
    description: 'Ngày bắt đầu (ISO format: YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    type: String,
    description: 'Ngày kết thúc (ISO format: YYYY-MM-DD)',
    example: '2026-01-31',
  })
  @IsDateString()
  endDate: string;
}
