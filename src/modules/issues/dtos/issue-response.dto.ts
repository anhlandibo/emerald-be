import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IssueType } from '../enums/issue-type.enum';
import { IssueStatus } from '../enums/issue-status.enum';

class ReporterDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Expose()
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @Expose()
  phoneNumber: string;
}

class BlockDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Tòa A - Sakura' })
  @Expose()
  name: string;
}

@Exclude()
export class IssueResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: IssueType.TECHNICAL, enum: IssueType })
  @Expose()
  type: string;

  @ApiProperty({ example: 'Kỹ thuật' })
  @Expose()
  typeLabel: string;

  @ApiProperty({ example: 'Thang máy tầng 5 bị hỏng' })
  @Expose()
  title: string;

  @ApiProperty({ example: 'Thang máy số 2 tại tòa A bị kẹt' })
  @Expose()
  description: string;

  @ApiProperty({ type: BlockDto, nullable: true })
  @Expose()
  @Type(() => BlockDto)
  block: BlockDto | null;

  @ApiProperty({ example: 5 })
  @Expose()
  floor: number;

  @ApiProperty({ example: 'Khu vực thang máy số 2' })
  @Expose()
  detailLocation: string;

  @ApiProperty({ type: [String] })
  @Expose()
  fileUrls: string[];

  @ApiProperty({ example: IssueStatus.PENDING, enum: IssueStatus })
  @Expose()
  status: string;

  @ApiProperty({ example: 'Chờ xử lý' })
  @Expose()
  statusLabel: string;

  @ApiProperty({ example: true })
  @Expose()
  isUrgent: boolean;

  @ApiProperty({ example: 5, nullable: true })
  @Expose()
  rating: number;

  @ApiProperty({ example: 'Xử lý rất tốt', nullable: true })
  @Expose()
  feedback: string;

  @ApiProperty({ type: ReporterDto, nullable: true })
  @Expose()
  @Type(() => ReporterDto)
  reporter: ReporterDto | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ example: '2024-01-20T15:00:00Z', nullable: true })
  @Expose()
  estimatedCompletionDate: Date;
}
