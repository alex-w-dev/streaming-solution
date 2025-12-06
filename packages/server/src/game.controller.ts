import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('spawn-player-tank')
  spawnPlayerTank(@Body() body: { level: number }): { success: boolean } {
    if (typeof body.level !== 'number' || body.level < 1 || body.level > 11) {
      throw new HttpException(
        'Level must be a number between 1 and 11',
        HttpStatus.BAD_REQUEST,
      );
    }

    const success = this.gameService.spawnPlayerTank(body.level);
    if (!success) {
      throw new HttpException(
        'Failed to spawn tank',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { success: true };
  }

  @Get('bot-level')
  getBotLevel(): { level: number } {
    return { level: this.gameService.getBotLevel() };
  }
}

