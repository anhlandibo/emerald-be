import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { NotiType } from '../enums/noti-type.enum';
import { ScopeType } from '../enums/scope-type.enum';

class BlockInfoDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;
}

class TargetBlockDetailDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  blockId: number;

  @ApiProperty({ type: () => BlockInfoDto })
  @Expose()
  @Type(() => BlockInfoDto)
  block?: BlockInfoDto;

  @ApiProperty()
  @Expose()
  targetFloorNumbers?: number[];
}

export class NotificationDetailResponseDto {
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

  @ApiProperty()
  @Expose()
  fileUrls: string[];

  @ApiProperty({ enum: ScopeType })
  @Expose()
  targetScope: ScopeType;

  @ApiProperty()
  @Expose()
  channels: string[];

  @ApiProperty({ type: [TargetBlockDetailDto] })
  @Expose()
  @Type(() => TargetBlockDetailDto)
  targetBlocks?: TargetBlockDetailDto[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
