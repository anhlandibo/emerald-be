import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BlockHasResidentsResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the block has any residents',
  })
  @Expose()
  hasResidents: boolean;
}
