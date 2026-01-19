import { ApiProperty } from '@nestjs/swagger';
import { CCCDDataDto } from './cccd-data.dto';

export class CCCDResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether CCCD extraction was successful',
  })
  success: boolean;

  @ApiProperty({
    type: CCCDDataDto,
    nullable: true,
    description: 'Extracted CCCD data (null if extraction failed)',
  })
  data: CCCDDataDto | null;

  @ApiProperty({
    example: 0.94,
    description: 'Overall OCR confidence score (0.0 - 1.0)',
  })
  ocr_confidence: number;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Raw OCR text (not exposed in production for privacy)',
  })
  raw_text: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Error message if extraction failed',
  })
  error: string | null;

  @ApiProperty({
    example: 'Đọc thông tin CCCD thành công',
    nullable: true,
    description: 'User-friendly status message',
  })
  message?: string;
}
