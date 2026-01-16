import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { IssueStatus } from '../enums/issue-status.enum';

export class UpdateIssueStatusDto {
  @ApiProperty({
    example: IssueStatus.PROCESSING,
    description: 'Status mới cho phản ánh',
    enum: IssueStatus,
  })
  @IsEnum(IssueStatus, { message: 'Status must be a valid issue status' })
  @IsNotEmpty({ message: 'Status is required' })
  status: IssueStatus;
}
