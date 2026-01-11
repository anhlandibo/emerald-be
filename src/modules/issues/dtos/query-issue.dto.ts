import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryDto } from 'src/dtos/query.dto';
import { IssueStatus } from '../enums/issue-status.enum';
import { IssueType } from '../enums/issue-type.enum';

export class QueryIssueDto extends QueryDto {
  @ApiProperty({
    example: IssueStatus.PENDING,
    description: 'Lọc theo trạng thái',
    enum: IssueStatus,
    required: false,
  })
  @IsEnum(IssueStatus, { message: 'Status must be a valid issue status' })
  @IsOptional()
  status?: IssueStatus;

  @ApiProperty({
    example: IssueType.TECHNICAL,
    description: 'Lọc theo loại phản ánh',
    enum: IssueType,
    required: false,
  })
  @IsEnum(IssueType, { message: 'Type must be a valid issue type' })
  @IsOptional()
  type?: IssueType;

  @ApiProperty({
    example: 1,
    description: 'Lọc theo tòa nhà',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Block ID must be an integer' })
  @Min(1, { message: 'Block ID must be >= 1' })
  blockId?: number;

  @ApiProperty({
    example: true,
    description: 'Lọc phản ánh khẩn cấp',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isUrgent?: boolean;
}
