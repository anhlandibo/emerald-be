import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class VoteDto {
  @ApiProperty({ example: 55 })
  @IsInt()
  optionId: number;
}
