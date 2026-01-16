import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ApartmentType } from '../enums/apartment-type.enum';

class GeneralInfoDto {
  @ApiProperty({ example: 'A-12.05' })
  @Expose()
  apartmentName: string;

  @ApiProperty({ example: 'A' })
  @Expose()
  building: string;

  @ApiProperty({ example: 12 })
  @Expose()
  floor: number;

  @ApiProperty({ example: 300, description: 'Diện tích căn hộ (m2)' })
  @Expose()
  area: number;

  @ApiProperty({ example: 'STUDIO', enum: ApartmentType })
  @Expose()
  type: string;

  @ApiProperty({ example: 'Trống' })
  @Expose()
  status: string;
}

class OwnerDto {
  @ApiProperty({ example: 'Phúc Nguyễn' })
  @Expose()
  fullName: string;

  @ApiProperty({ example: '0838609516' })
  @Expose()
  phone: string;

  @ApiProperty({ example: '0000000' })
  @Expose()
  identityCard: string;
}

class ResidentDetailDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Nguyễn Đăng Phúc' })
  @Expose()
  fullName: string;

  @ApiProperty({ example: 'Nam' })
  @Expose()
  gender: string;

  @ApiProperty({ example: '0838609516' })
  @Expose()
  phone: string;

  @ApiProperty({
    example: [
      { value: 'OWNER', label: 'Chủ nhân' },
      { value: 'SPOUSE', label: 'Vợ/Chồng' },
      { value: 'CHILD', label: 'Con' },
      { value: 'PARTNER', label: 'Ở ghép' },
    ],
    description: 'Mối quan hệ với chủ nhân căn hộ',
  })
  @Expose()
  relationship: { value: string; label: string }[];
}

@Exclude()
export class ApartmentDetailResponseDto {
  @ApiProperty({ type: GeneralInfoDto })
  @Expose()
  generalInfo: GeneralInfoDto;

  @ApiProperty({ type: OwnerDto })
  @Expose()
  owner: OwnerDto;

  @ApiProperty({ type: [ResidentDetailDto] })
  @Expose()
  residents: ResidentDetailDto[];
}
