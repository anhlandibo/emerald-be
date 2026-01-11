import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QueryDto } from 'src/dtos/query.dto';
import { ServiceType } from '../enums/service-type.enum';

export class QueryServiceDto extends QueryDto {
  @ApiProperty({
    example: ServiceType.NORMAL,
    description: 'Lọc theo loại dịch vụ',
    enum: ServiceType,
    required: false,
  })
  @IsEnum(ServiceType, { message: 'Type must be a valid service type' })
  @IsOptional()
  type?: ServiceType;
}
