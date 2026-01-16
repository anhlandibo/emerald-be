import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceResult } from '../enums/maintenance-result.enum';

export class CompleteIncidentMaintenanceTicketDto {
  @ApiProperty({
    example: MaintenanceResult.GOOD,
    enum: MaintenanceResult,
    description: 'Kết quả sự cố: GOOD, NEEDS_REPAIR, hoặc MONITORING',
  })
  @IsEnum(MaintenanceResult, { message: 'Kết quả sự cố không hợp lệ' })
  @IsNotEmpty({ message: 'Kết quả sự cố không được để trống' })
  result: MaintenanceResult;

  @ApiProperty({
    example: 1500000,
    description: 'Actual cost spent on fixing the incident',
  })
  @IsNumber()
  @Min(0, { message: 'Chi phí thực tế phải >= 0' })
  @IsNotEmpty({ message: 'Chi phí thực tế không được để trống' })
  @Type(() => Number)
  actualCost: number;

  @ApiPropertyOptional({
    example: 'Đã kiểm tra và sửa chữa hoàn tất',
    description: 'Detailed notes about the incident resolution',
  })
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  resultNote?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Hình ảnh chứng minh (tối đa 50MB)',
  })
  @IsOptional()
  image?: Express.Multer.File;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Video chứng minh (tối đa 100MB)',
  })
  @IsOptional()
  video?: Express.Multer.File;
}
