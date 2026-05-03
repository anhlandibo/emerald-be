import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleActiveDto {
  @ApiProperty({
    example: false,
    description:
      'true = activate, false = deactivate (invalidates JWT on next request)',
  })
  @IsBoolean()
  isActive: boolean;
}
