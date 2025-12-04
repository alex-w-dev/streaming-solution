import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { TanksService } from './tanks.service';
import type { Tank } from '@streaming/shared';
import axios from 'axios';

@Controller('tanks')
export class TanksController {
  constructor(private readonly tanksService: TanksService) {}

  @Get()
  getTanks(): Tank[] {
    return this.tanksService.getAllTanks();
  }

  @Get('colorized-icon')
  async getColorizedIcon(
    @Query('url') iconUrl: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!iconUrl) {
        throw new HttpException('Icon URL is required', HttpStatus.BAD_REQUEST);
      }

      // Декодируем URL иконки (может быть закодирован дважды)
      let decodedIcon = decodeURIComponent(iconUrl);
      // Если все еще есть закодированные символы, декодируем еще раз
      if (decodedIcon.includes('%')) {
        decodedIcon = decodeURIComponent(decodedIcon);
      }

      // Загружаем оригинальный SVG
      const response = await axios.get(decodedIcon, {
        responseType: 'text',
        timeout: 5000,
      });

      let svgContent = response.data;

      // Генерируем случайный цвет на основе URL
      const urlHash = decodedIcon
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = urlHash % 360;
      const saturation = 70 + (urlHash % 20); // 70-90%
      const lightness = 45 + (urlHash % 15); // 45-60%
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      // Заменяем fill в SVG
      // Ищем все fill атрибуты и заменяем их на наш цвет
      svgContent = svgContent.replace(/fill="[^"]*"/g, `fill="${color}"`);

      // Также заменяем fill без кавычек и fill в style
      svgContent = svgContent.replace(/fill:\s*[^;]+/g, `fill: ${color}`);

      // Если нет fill атрибутов, добавляем fill к основному элементу
      if (!svgContent.includes('fill=') && !svgContent.includes('fill:')) {
        svgContent = svgContent.replace(
          /<svg([^>]*)>/,
          `<svg$1 fill="${color}">`,
        );
      }

      // Устанавливаем заголовки для SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(svgContent);
    } catch (error) {
      console.error('Error fetching colorized icon:', error);
      throw new HttpException(
        'Failed to fetch colorized icon',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
