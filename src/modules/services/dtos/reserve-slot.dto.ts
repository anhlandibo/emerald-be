import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SlotItem {
  @ApiProperty({ example: '14:00', description: 'Giờ bắt đầu (HH:mm)' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in format HH:mm',
  })
  @IsNotEmpty({ message: 'Start time cannot be empty' })
  startTime: string;

  @ApiProperty({ example: '15:00', description: 'Giờ kết thúc (HH:mm)' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in format HH:mm',
  })
  @IsNotEmpty({ message: 'End time cannot be empty' })
  endTime: string;
}

export class ReserveSlotDto {
  @ApiProperty({ example: '2024-01-20', description: 'Ngày đặt (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Ngày đặt không đúng định dạng YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Vui lòng chọn ngày đặt' })
  bookingDate: string;

  @ApiProperty({
    type: [SlotItem],
    description: 'Danh sách các slot chọn (có thể không liên tiếp)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotItem)
  @IsNotEmpty({ message: 'Danh sách slot không được để trống' })
  slots: SlotItem[];
}
