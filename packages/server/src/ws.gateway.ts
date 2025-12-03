import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { ExampleMessage } from '@streaming/shared';
import { formatMessage } from '@streaming/shared';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log('Client connected', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected', client.id);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any): void {
    const msg = data as ExampleMessage;
    const formatted = formatMessage(msg);
    this.server.emit('message', formatted);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() _data: string): void {
    this.server.emit('pong', 'pong');
  }
}
