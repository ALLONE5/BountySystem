import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NotificationPushService } from './NotificationPushService.js';
import { JWTService } from '../utils/jwt.js';

export class WebSocketService {
  private io: SocketIOServer;
  private pushService: NotificationPushService;
  private userSockets: Map<string, Set<string>>; // userId -> Set of socket IDs

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
    });

    this.pushService = new NotificationPushService();
    this.userSockets = new Map();

    this.setupSocketHandlers();
    this.setupBroadcastSubscription();
  }

  private async setupBroadcastSubscription() {
    // Global subscription for broadcasts
    await this.pushService.subscribeToBroadcasts((notification) => {
      // Emit to all connected clients
      this.io.emit('notification', notification);
    });
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Authenticate the socket connection
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = JWTService.verifyToken(token);
          const userId = decoded.userId;

          // Store the socket for this user
          let isFirstConnection = false;
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
            isFirstConnection = true;
          }
          this.userSockets.get(userId)!.add(socket.id);

          // Join user-specific room
          socket.join(`user:${userId}`);

          // Subscribe to Redis notifications for this user ONLY if it's the first connection
          if (isFirstConnection) {
            await this.subscribeToUserNotifications(userId);
          }

          socket.emit('authenticated', { success: true, userId });
          console.log(`User ${userId} authenticated on socket ${socket.id}`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
          socket.disconnect();
        }
      });

      socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id);
        // Remove socket from user mapping
        for (const [userId, sockets] of this.userSockets.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.userSockets.delete(userId);
              // Unsubscribe from Redis user channel when last socket disconnects
              await this.unsubscribeFromUserNotifications(userId);
            }
            break;
          }
        }
      });
    });
  }

  private async subscribeToUserNotifications(userId: string) {
    // Subscribe to user-specific notifications
    await this.pushService.subscribeToUserNotifications(userId, (notification) => {
      this.io.to(`user:${userId}`).emit('notification', notification);
    });
  }

  private async unsubscribeFromUserNotifications(userId: string) {
    await this.pushService.unsubscribeFromUserNotifications(userId);
  }

  /**
   * Send a notification to a specific user
   */
  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Broadcast to all connected clients
   */
  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  /**
   * Get the number of connected sockets for a user
   */
  public getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Get total number of connected clients
   */
  public getConnectionCount(): number {
    return this.io.sockets.sockets.size;
  }
}
