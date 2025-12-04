import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsGateway } from './ws.gateway';
import { TanksController } from './tanks.controller';
import { TanksService } from './tanks.service';
import { GameService } from './game.service';

@Module({
  imports: [],
  controllers: [AppController, TanksController],
  providers: [AppService, WsGateway, TanksService, GameService],
})
export class AppModule {}
