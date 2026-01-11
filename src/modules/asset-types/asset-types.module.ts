import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetTypesService } from './asset-types.service';
import { AssetTypesController } from './asset-types.controller';
import { AssetType } from './entities/asset-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetType])],
  controllers: [AssetTypesController],
  providers: [AssetTypesService],
  exports: [AssetTypesService],
})
export class AssetTypesModule {}
