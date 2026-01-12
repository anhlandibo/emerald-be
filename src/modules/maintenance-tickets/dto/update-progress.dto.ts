import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistItemDto } from './create-maintenance-ticket.dto';

export class UpdateProgressDto {
  @ApiProperty({
    type: [ChecklistItemDto],
    description: 'Updated checklist items with completion status',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklistItems: ChecklistItemDto[];
}
