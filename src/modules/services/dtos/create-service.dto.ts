import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Matches,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from '../enums/service-type.enum';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Bể bơi',
    description: 'Tên dịch vụ',
  })
  @IsNotEmpty({ message: 'Tên dịch vụ không được để trống' })
  @IsString({ message: 'Tên dịch vụ phải là chuỗi ký tự' })
  name: string;

  @ApiProperty({
    example: 'Bể bơi ngoài trời, sạch sẽ và an toàn',
    description: 'Mô tả dịch vụ',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description?: string;

  @ApiProperty({
    example: '06:00',
    description: 'Giờ mở cửa (HH:mm)',
  })
  @IsNotEmpty({ message: 'Giờ mở cửa không được để trống' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Giờ mở cửa phải có định dạng HH:mm',
  })
  openHour: string;

  @ApiProperty({
    example: '22:00',
    description: 'Giờ đóng cửa (HH:mm)',
  })
  @IsNotEmpty({ message: 'Giờ đóng cửa không được để trống' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Giờ đóng cửa phải có định dạng HH:mm',
  })
  closeHour: string;

  @ApiProperty({
    example: 50000,
    description: 'Giá dịch vụ theo đơn vị thời gian (VND)',
  })
  @IsNotEmpty({ message: 'Giá dịch vụ không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá dịch vụ phải là số' })
  @Min(0, { message: 'Giá dịch vụ phải lớn hơn hoặc bằng 0' })
  unitPrice: number;

  @ApiProperty({
    example: 60,
    description: 'Độ dài mỗi khung giờ (phút)',
  })
  @IsNotEmpty({ message: 'Độ dài khung giờ không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Độ dài khung giờ phải là số' })
  @Min(1, { message: 'Độ dài khung giờ phải lớn hơn 0' })
  unitTimeBlock: number;

  @ApiProperty({
    example: 100,
    description: 'Số chỗ khả dụng mỗi khung giờ',
  })
  @IsNotEmpty({ message: 'Số chỗ khả dụng không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Số chỗ khả dụng phải là số' })
  @Min(1, { message: 'Số chỗ khả dụng phải lớn hơn 0' })
  totalSlot: number;

  @ApiProperty({
    example: ServiceType.NORMAL,
    description: 'Loại dịch vụ',
    enum: ServiceType,
    required: false,
  })
  @IsOptional()
  @IsEnum(ServiceType, { message: 'Loại dịch vụ không hợp lệ' })
  type?: ServiceType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Hình ảnh dịch vụ (tối đa 50MB)',
    required: false,
  })
  @IsOptional()
  image?: Express.Multer.File;
}
