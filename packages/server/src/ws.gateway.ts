import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { ExampleMessage, GameState } from '@streaming/shared';
import { formatMessage } from '@streaming/shared';
import { GameService } from './game.service';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private gameStateInterval: NodeJS.Timeout | null = null;
  private readonly BROADCAST_RATE = 30; // обновлений в секунду

  constructor(private gameService: GameService) {}

  onModuleInit() {
    // Транслируем состояние игры клиентам
    // Используем setTimeout чтобы убедиться, что server инициализирован
    setTimeout(() => {
      this.gameStateInterval = setInterval(() => {
        if (this.server) {
          const gameState = this.gameService.getGameState();
          this.server.emit('gameState', gameState);
        }
      }, 1000 / this.BROADCAST_RATE);
    }, 100);
  }

  handleConnection(client: any) {
    console.log('Client connected', client.id);
    // Отправляем текущее состояние при подключении
    const gameState = this.gameService.getGameState();
    client.emit('gameState', gameState);
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

  @SubscribeMessage('togglePause')
  handleTogglePause(): void {
    this.gameService.togglePause();
    const gameState = this.gameService.getGameState();
    this.server.emit('gameState', gameState);
  }

  onModuleDestroy() {
    if (this.gameStateInterval) {
      clearInterval(this.gameStateInterval);
    }
  }
}
