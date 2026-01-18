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
import {
  SystemNotificationPriority,
  SystemNotificationType,
} from 'src/modules/system-notifications/entities/system-notification.entity';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
  namespace: '/ws',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<number, Set<string>> = new Map(); // userId -> Set<socketId>
  // vì socket guard không hoạt động ở đây nên ta tự implement authentication
  afterInit(server: Server) {
    console.log('🚀 Socket Gateway initialized - Namespace: /ws');

    server.use(async (socket, next) => {
      try {
        console.log(
          '🔐 New connection attempt from:',
          socket.handshake.address,
        );

        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        console.log('🎫 Token received:', token ? 'YES' : 'NO');

        if (!token) {
          console.log('❌ Connection rejected - No token');
          return next(new Error('Unauthorized'));
        }

        const jwtService = new JwtService({
          secret: process.env.JWT_SECRET,
        });

        const payload = await jwtService.verifyAsync(token as string);
        console.log('✅ Token verified - User ID:', payload.sub);

        socket.data.user = payload;

        next();
      } catch (err) {
        console.log(
          '❌ Connection rejected - Invalid token:',
          err instanceof Error ? err.message : 'Unknown error',
        );
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: Socket) {
    const userId = client.data.user?.sub as number;
    console.log('✅ Socket Connected:', {
      socketId: client.id,
      userId: userId,
      email: client.data.user?.email || 'N/A',
    });

    if (userId) {
      // Track connected user
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      // Join user to their personal room
      client.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined room: user:${userId}`);
    } else {
      console.log('⚠️ Connected but no userId found in token');
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub as number;
    console.log('🔌 Socket Disconnected:', {
      socketId: client.id,
      userId: userId,
    });

    if (userId) {
      // Remove socket from user's connections
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
    }
  }

  /**
   * Send system notification to specific users or all connected users
   */
  sendSystemNotification(
    notification: {
      id: number;
      title: string;
      content: string;
      type: SystemNotificationType;
      priority: SystemNotificationPriority;
      metadata: Record<string, any>;
      actionUrl: string | null;
      actionText: string | null;
      isPersistent: boolean;
      createdAt: Date;
      expiresAt: Date;
    },
    userIds?: number[],
  ) {
    if (userIds && userIds.length > 0) {
      // Send to specific users
      userIds.forEach((userId) => {
        this.server.to(`user:${userId}`).emit('system_notification', {
          ...notification,
          timestamp: new Date(),
        });
      });
    } else {
      // Broadcast to all connected clients
      this.server.emit('system_notification', {
        ...notification,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get count of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }
}
