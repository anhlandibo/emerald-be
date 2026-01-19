import { ApiProperty } from '@nestjs/swagger';
import { FieldConfidenceDto } from './field-confidence.dto';

export class CCCDDataDto {
  @ApiProperty({
    example: 'NGÔ MINH TRÍ',
    description: 'Full name from CCCD (Họ tên)',
  })
  name: string;

  @ApiProperty({
    example: '083205005215',
    description: 'ID number - 9 or 12 digits (Số CCCD)',
  })
  id_number: string;

  @ApiProperty({
    example: '31/07/2005',
    description: 'Date of birth in DD/MM/YYYY format (Ngày sinh)',
  })
  date_of_birth: string;

  @ApiProperty({
    example: '31/07/2030',
    description: 'Expiration date in DD/MM/YYYY format (Ngày hết hạn)',
  })
  date_expiration: string;

  @ApiProperty({
    example: 'Nam',
    description: 'Gender - "Nam" or "Nữ" (Giới tính)',
  })
  gender: string;

  @ApiProperty({
    example: 'Việt Nam',
    description: 'Nationality (Quốc tịch)',
  })
  nationality: string;

  @ApiProperty({
    example: 'Phú Khánh, Thạnh Phú, Bến Tre',
    description: 'Native place / Place of birth (Quê quán / Nơi sinh)',
  })
  native_place: string;

  @ApiProperty({
    example: '78/1, Ấp Thạnh Hòa A, TT. Thạnh Phú, Thạnh Phú, Bến Tre',
    description: 'Place of residence (Nơi thường trú)',
  })
  place_of_residence: string;

  @ApiProperty({
    type: FieldConfidenceDto,
    description: 'Confidence scores for each field',
  })
  field_confidence: FieldConfidenceDto;

  @ApiProperty({
    example: 0.94,
    description: 'Overall confidence score (0.0 - 1.0)',
  })
  overall_confidence: number;

  @ApiProperty({
    example: 'Any clarifications or notes',
    nullable: true,
    description: 'Additional notes from OCR processing',
  })
  notes?: string;
}
