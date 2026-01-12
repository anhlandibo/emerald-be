import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Gender } from '../enums/gender.enum';
import { AccountResponseDto } from '../../accounts/dto/account-response.dto';

@Exclude()
export class ResidentResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the resident',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 1,
    description: 'Account ID associated with the resident',
  })
  @Expose()
  accountId: number;

  @ApiProperty({
    description: 'Account information',
    type: AccountResponseDto,
  })
  @Expose()
  @Type(() => AccountResponseDto)
  account: AccountResponseDto;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Full name of the resident',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    example: '079203001234',
    description: 'Citizen ID (CCCD)',
  })
  @Expose()
  citizenId: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    description: 'Image URL of the resident',
  })
  @Expose()
  imageUrl: string;

  @ApiProperty({
    example: '2000-01-01',
    description: 'Date of birth',
  })
  @Expose()
  dob: Date;

  @ApiProperty({
    example: Gender.MALE,
    description: 'Gender of the resident',
    enum: Gender,
  })
  @Expose()
  gender: Gender;

  @ApiProperty({
    example: '0901234567',
    description: 'Phone number',
  })
  @Expose()
  phoneNumber: string;

  @ApiProperty({
    example: 'Việt Nam',
    description: 'Nationality',
  })
  @Expose()
  nationality: string;

  @ApiProperty({
    example: 'Hồ Chí Minh',
    description: 'Province/City',
  })
  @Expose()
  province: string;

  @ApiProperty({
    example: 'Quận 1',
    description: 'District',
  })
  @Expose()
  district: string;

  @ApiProperty({
    example: 'Phường Bến Nghé',
    description: 'Ward',
  })
  @Expose()
  ward: string;

  @ApiProperty({
    example: '123 Đường Nguyễn Huệ',
    description: 'Detailed address',
  })
  @Expose()
  detailAddress: string;

  @ApiProperty({
    example: true,
    description: 'Whether the resident is active',
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'The creation date of the resident',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'The last update date of the resident',
  })
  @Expose()
  updatedAt: Date;
}
