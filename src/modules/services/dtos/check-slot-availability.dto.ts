import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class CheckSlotAvailabilityDto {
  @ApiProperty({
    example: '2024-01-20',
    description: 'Ngày muốn kiểm tra (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'Date must be a valid date string' })
  @IsNotEmpty({ message: 'Date cannot be empty' })
  date: string;
}
