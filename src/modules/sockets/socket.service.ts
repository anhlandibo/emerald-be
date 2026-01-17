/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// socket.service.ts
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class SocketService {
  joinRoom(client: Socket, payload: { roomId: string }) {
    client.join(payload.roomId);
    return { joined: payload.roomId };
  }

  handleNewMessage(
    server: Server,
    client: Socket,
    payload: { roomId: string; message: string },
  ) {
    const user = client.data.user;

    server.to(payload.roomId).emit('new_message', {
      userId: user.sub,
      message: payload.message,
      createdAt: new Date(),
    });
  }
}
