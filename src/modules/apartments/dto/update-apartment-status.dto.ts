import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApartmentStatus } from '../enums/apartment-status.enum';

export class UpdateApartmentStatusDto {
  @ApiProperty({
    description: 'Status of the apartment',
    enum: ApartmentStatus,
    example: ApartmentStatus.OCCUPIED,
  })
  @IsEnum(ApartmentStatus, {
    message: 'Status must be OCCUPIED, VACANT, or MAINTENANCE',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status: ApartmentStatus;
}
