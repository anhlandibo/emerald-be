import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RejectIssueDto {
  @ApiProperty({
    example: 'Vấn đề không thuộc thẩm quyền quản lý',
    description: 'Lý do từ chối xử lý phản ánh',
    minLength: 10,
    maxLength: 500,
  })
  @IsString({ message: 'Rejection reason must be a string' })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters' })
  @MaxLength(500, {
    message: 'Rejection reason must not exceed 500 characters',
  })
  rejectionReason: string;
}
