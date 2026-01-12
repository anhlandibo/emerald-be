import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateFeeTierDto {
  @ApiProperty({
    example: 'Bậc 1',
    description: 'Tên bậc thang (Bậc 1, Bậc 2...)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 0,
    description: 'Từ số (VD: 0 kwh)',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  fromValue: number;

  @ApiProperty({
    example: 50,
    description: 'Đến số (VD: 50 kwh). Null nếu là vô cùng',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o: CreateFeeTierDto) => o.toValue !== null)
  toValue?: number;

  @ApiProperty({
    example: 1806,
    description: 'Đơn giá của bậc này (VNĐ)',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  unitPrice: number;
}
