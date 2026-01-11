import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IssueStatus } from '../enums/issue-status.enum';

export class UpdateIssueDto {
  @ApiProperty({
    example: IssueStatus.RECEIVED,
    description: 'Cập nhật trạng thái phản ánh',
    enum: IssueStatus,
    required: false,
  })
  @IsEnum(IssueStatus, { message: 'Status must be a valid issue status' })
  @IsOptional()
  status?: IssueStatus;

  @ApiProperty({
    example: true,
    description: 'Đánh dấu khẩn cấp (chỉ BQL)',
    required: false,
  })
  @IsBoolean({ message: 'Is urgent must be a boolean' })
  @IsOptional()
  isUrgent?: boolean;

  @ApiProperty({
    example: '2024-01-20T17:00:00Z',
    description: 'Thời gian dự kiến hoàn thành',
    required: false,
  })
  @IsDateString(
    {},
    { message: 'Estimated completion date must be a valid date' },
  )
  @IsOptional()
  estimatedCompletionDate?: Date;

  @ApiProperty({
    example: 1,
    description: 'ID phiếu bảo trì liên kết (nếu có)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Maintenance ticket ID must be an integer' })
  @Min(1, { message: 'Maintenance ticket ID must be >= 1' })
  maintenanceTicketId?: number;
}
