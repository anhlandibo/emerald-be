import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import getDatabaseConfig from './configs/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CloudinaryModule, TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
