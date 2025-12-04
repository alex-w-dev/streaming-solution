import { Controller, Get } from '@nestjs/common';
import { TanksService } from './tanks.service';
import { Tank } from '@streaming/shared';

@Controller('tanks')
export class TanksController {
  constructor(private readonly tanksService: TanksService) {}

  @Get()
  getTanks(): Tank[] {
    return this.tanksService.getAllTanks();
  }
}

