import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './entities/asset.entity';
import { AssetType } from '../asset-types/entities/asset-type.entity';
import { Block } from '../blocks/entities/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, AssetType, Block])],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
