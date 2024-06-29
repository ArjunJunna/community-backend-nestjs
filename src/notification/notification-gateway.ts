import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private connectedClients: Map<any, any> = new Map();

  afterInit(server: Server) {
    console.log('Init', server);
  }

  handleConnection(client: Socket) {
    console.log(`Entered client id: ${client.id}`);
    console.log('Already connected clients: ', this.connectedClients);
    client.on('register', (userEntry: any) => {
      const { userId } = userEntry;
      this.connectedClients.set(userId, client.id);
      console.log(
        'Connected clients after registration: ',
        this.connectedClients,
      );
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.forEach((value, key) => {
      if (value === client.id) {
        this.connectedClients.delete(key);
      }
    });
    console.log(
      'Remaining clients after disconnect: ',
      this.connectedClients,
    );
  }

  sendNotificationToUser(userId: string, message: any) {
    const clientId = this.connectedClients.get(userId);
    if (clientId) {
      this.server.to(clientId).emit('notification', message);
    }
  }
}
