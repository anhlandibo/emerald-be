/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/ws',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  // vì socket guard không hoạt động ở đây nên ta tự implement authentication
  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Unauthorized'));
        }

        const jwtService = new JwtService({
          secret: process.env.JWT_SECRET,
        });

        const payload = await jwtService.verifyAsync(token);

        socket.data.user = payload;

        next();
      } catch (err) {
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: Socket) {
    console.log('Connected:', client.id, client.data.user);
  }

  handleDisconnect(client: Socket) {
    console.log('Disconnected:', client.id);
  }
}
