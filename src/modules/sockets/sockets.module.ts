import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SocketGateway } from 'src/modules/sockets/socket.gateway';
import { SocketAuthGuard } from 'src/modules/sockets/socket.guard';
import { SocketService } from 'src/modules/sockets/socket.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],

  providers: [SocketGateway, SocketService, SocketAuthGuard],
})
export class SocketsModule {}
