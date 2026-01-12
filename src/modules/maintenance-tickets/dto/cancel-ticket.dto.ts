import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelTicketDto {
  @ApiProperty({
    example: 'Báo cáo nhầm, thiết bị vẫn bình thường.',
    description: 'Reason for cancellation',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
