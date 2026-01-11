import { ApiProperty } from '@nestjs/swagger';
import { IntegerRequired } from 'src/decorators/dto.decorator';
import { StringOptional } from 'src/decorators/dto.decorator';

export class RateIssueDto {
  @ApiProperty({
    example: 5,
    description: 'Đánh giá từ 1-5 sao',
    minimum: 1,
    maximum: 5,
  })
  @IntegerRequired('Rating', 1, 5)
  rating: number;

  @ApiProperty({
    example: 'Xử lý rất nhanh và chuyên nghiệp',
    description: 'Nhận xét về việc xử lý phản ánh',
    required: false,
  })
  @StringOptional()
  feedback?: string;
}
