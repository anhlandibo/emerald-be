import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SocketGateway } from 'src/modules/sockets/socket.gateway';
import { SocketService } from 'src/modules/sockets/socket.service';
import { SystemNotificationsModule } from '../system-notifications/system-notifications.module';
import { SystemNotificationsService } from 'src/modules/system-notifications/system-notifications.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    SystemNotificationsModule,
  ],

  providers: [SocketGateway, SocketService],
  exports: [SocketGateway],
})
export class SocketsModule {
  constructor(
    private readonly socketGateway: SocketGateway,
    private readonly systemNotificationsService: SystemNotificationsService,
  ) {}

  onModuleInit() {
    // Set socket gateway reference in system notifications service
    this.systemNotificationsService.setSocketGateway(this.socketGateway);
  }
}
