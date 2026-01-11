import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IssueType } from '../enums/issue-type.enum';
import { StringRequired, StringOptional } from 'src/decorators/dto.decorator';

export class CreateIssueDto {
  @ApiProperty({
    example: IssueType.TECHNICAL,
    description: 'Loại phản ánh',
    enum: IssueType,
  })
  @IsEnum(IssueType, { message: 'Type must be a valid issue type' })
  @IsNotEmpty({ message: 'Type cannot be empty' })
  type: IssueType;

  @ApiProperty({
    example: 'Thang máy tầng 5 bị hỏng',
    description: 'Tiêu đề phản ánh',
  })
  @StringRequired('Title')
  title: string;

  @ApiProperty({
    example: 'Thang máy số 2 tại tòa A bị kẹt ở tầng 5 từ sáng nay',
    description: 'Mô tả chi tiết',
    required: false,
  })
  @StringOptional()
  description?: string;

  @ApiProperty({
    example: 1,
    description: 'ID tòa nhà',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Block ID must be an integer' })
  @Min(1, { message: 'Block ID must be >= 1' })
  blockId?: number;

  @ApiProperty({
    example: 5,
    description: 'Tầng',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Floor must be an integer' })
  floor?: number;

  @ApiProperty({
    example: 'Khu vực thang máy số 2',
    description: 'Vị trí chi tiết',
    required: false,
  })
  @StringOptional()
  detailLocation?: string;

  @ApiProperty({
    description: 'Danh sách ảnh đính kèm (Tối đa 5 file)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
  })
  files?: any[]; // Trường này để Swagger hiện nút Upload

  fileUrls?: string[]; // Trường này dùng để lưu URL sau khi upload thành công
}
