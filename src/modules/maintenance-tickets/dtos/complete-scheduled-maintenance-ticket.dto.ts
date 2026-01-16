import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceResult } from '../enums/maintenance-result.enum';

export class CompleteScheduledMaintenanceTicketDto {
  @ApiProperty({
    example: MaintenanceResult.GOOD,
    enum: MaintenanceResult,
    description: 'Kết quả bảo trì: GOOD, NEEDS_REPAIR, hoặc MONITORING',
  })
  @IsEnum(MaintenanceResult, { message: 'Kết quả bảo trì không hợp lệ' })
  @IsNotEmpty({ message: 'Kết quả bảo trì không được để trống' })
  result: MaintenanceResult;

  @ApiProperty({
    example: 2000000,
    description: 'Chi phí thực tế chi trả cho bảo trì',
  })
  @IsNumber()
  @Min(0, { message: 'Chi phí thực tế phải >= 0' })
  @IsNotEmpty({ message: 'Chi phí thực tế không được để trống' })
  @Type(() => Number)
  actualCost: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Có phát hiện vấn đề bổ sung không',
  })
  @IsBoolean({ message: 'hasIssue phải là giá trị boolean' })
  @IsOptional()
  hasIssue?: boolean;

  @ApiPropertyOptional({
    example: 'Cần thay dầu sau 1 tháng',
    description: 'Chi tiết vấn đề phát hiện (nếu có)',
  })
  @IsString({ message: 'Chi tiết vấn đề phải là chuỗi ký tự' })
  @IsOptional()
  issueDetail?: string;

  @ApiPropertyOptional({
    example: 'Đã kiểm tra, bôi trơn và bảo trì theo kế hoạch',
    description: 'Ghi chú về kết quả bảo trì',
  })
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  resultNote?: string;
}
