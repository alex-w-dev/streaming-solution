import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Tank } from '@streaming/shared';

@Injectable()
export class TanksService {
  private tanks: Tank[] = [];

  constructor() {
    this.loadTanks();
  }

  private loadTanks() {
    try {
      // Определяем путь к файлу: пробуем разные варианты
      let filePath: string;

      if (__dirname.includes('dist')) {
        // Production: __dirname = packages/server/dist/src
        // Файл может быть в dist/data.json или dist/data/data.json
        filePath = join(__dirname, '..', 'data.json');
        if (!existsSync(filePath)) {
          filePath = join(__dirname, '..', 'data', 'data.json');
        }
      } else {
        // Dev: __dirname = packages/server/src
        // Файл в packages/server/data/data.json
        filePath = join(__dirname, '..', 'data', 'data.json');
      }

      if (!existsSync(filePath)) {
        // Fallback: относительно process.cwd()
        filePath = join(
          process.cwd(),
          'packages',
          'server',
          'data',
          'data.json',
        );
      }

      const fileContent = readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);

      const rawTanks = jsonData.data?.data || [];
      const parameters = jsonData.data?.parameters || [];

      this.tanks = rawTanks.map((tankArray: any[]) => {
        const tank: Tank = {} as Tank;

        // Маппим каждый элемент массива на соответствующее имя параметра
        tankArray.forEach((value: any, index: number) => {
          if (parameters[index]) {
            const paramName = parameters[index];
            tank[paramName] = value;
          }
        });

        return tank;
      });
    } catch (error) {
      console.error('Error loading tanks data:', error);
      this.tanks = [];
    }
  }

  getAllTanks(): Tank[] {
    return this.tanks;
  }
}
