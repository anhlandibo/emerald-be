import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class SummarizeDto {
  @ApiProperty({
    description: 'File để upload (PDF, DOCX, Ảnh hoặc TXT)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  file?: any;

  @ApiProperty({
    description: 'Nội dung text cần tóm tắt (nếu không upload file)',
    example: 'Thông báo cúp điện khu vực A từ 14h-16h...',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50000)
  text?: string;
}
