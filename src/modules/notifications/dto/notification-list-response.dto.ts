import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { NotiType } from '../enums/noti-type.enum';
import { ScopeType } from '../enums/scope-type.enum';

class TargetBlockResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  blockId: number;

  @ApiProperty()
  @Expose()
  blockName?: string;

  @ApiProperty()
  @Expose()
  targetFloorNumbers?: number[];
}

export class NotificationListResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiProperty({ enum: NotiType })
  @Expose()
  type: NotiType;

  @ApiProperty()
  @Expose()
  isUrgent: boolean;

  @ApiProperty({ enum: ScopeType })
  @Expose()
  targetScope: ScopeType;

  @ApiProperty()
  @Expose()
  channels: string[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
