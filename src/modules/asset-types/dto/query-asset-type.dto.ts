import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { QueryDto } from 'src/dtos/query.dto';

export class QueryAssetTypeDto extends QueryDto {}
