import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TechnicianStatus } from '../enums/technician-status.enum';

export class TechnicianResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'Technician ID' })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Nguyen Van A', description: 'Full name' })
  fullName: string;

  @Expose()
  @ApiProperty({ example: '0912345678', description: 'Phone number' })
  phoneNumber: string;

  @Expose()
  @ApiProperty({
    example: TechnicianStatus.AVAILABLE,
    description: 'Status',
    enum: TechnicianStatus,
  })
  status: TechnicianStatus;

  @Expose()
  @ApiProperty({
    example: 'Experienced in plumbing',
    description: 'Description',
  })
  description: string;

  @Expose()
  @Type(() => Date)
  @ApiProperty({
    example: '2025-01-11T10:00:00Z',
    description: 'Created date',
  })
  createdAt: Date;
}
