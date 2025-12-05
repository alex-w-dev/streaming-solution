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
import * as fs from 'fs/promises';
import * as path from 'path';

@Controller('tanks')
export class TanksController {
  private readonly CACHE_DIR = path.join(process.cwd(), 'data', 'tank-icons');

  constructor(private readonly tanksService: TanksService) {
    this.ensureCacheDir();
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.CACHE_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating cache directory:', error);
    }
  }

  private getCacheFileName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = path.basename(pathname);
      return fileName || 'icon.svg';
    } catch (error) {
      // Если не удалось распарсить URL, извлекаем имя файла из пути
      const lastSlash = url.lastIndexOf('/');
      const fileName =
        lastSlash >= 0 ? url.substring(lastSlash + 1) : 'icon.svg';
      // Убираем query параметры если есть
      const questionMark = fileName.indexOf('?');
      return questionMark >= 0 ? fileName.substring(0, questionMark) : fileName;
    }
  }

  private getCacheFilePath(url: string): string {
    return path.join(this.CACHE_DIR, this.getCacheFileName(url));
  }

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

      const cacheFilePath = this.getCacheFilePath(decodedIcon);

      // Проверяем локальный кеш оригинального файла
      let svgContent: string;
      let cacheHit = false;
      try {
        svgContent = await fs.readFile(cacheFilePath, 'utf-8');
        cacheHit = true;
      } catch (error) {
        // Файл не найден, загружаем с сервера
        const response = await axios.get(decodedIcon, {
          responseType: 'text',
          timeout: 5000,
        });
        svgContent = response.data;

        // Сохраняем оригинальный SVG в кеш
        try {
          await fs.writeFile(cacheFilePath, svgContent, 'utf-8');
        } catch (error) {
          console.error('Error saving icon to cache:', error);
          // Продолжаем даже если не удалось сохранить
        }
      }

      // Обрабатываем цветом (применяем к оригинальному или закешированному SVG)
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
      let colorizedSvg = svgContent.replace(/fill="[^"]*"/g, `fill="${color}"`);

      // Также заменяем fill без кавычек и fill в style
      colorizedSvg = colorizedSvg.replace(/fill:\s*[^;]+/g, `fill: ${color}`);

      // Если нет fill атрибутов, добавляем fill к основному элементу
      if (!colorizedSvg.includes('fill=') && !colorizedSvg.includes('fill:')) {
        colorizedSvg = colorizedSvg.replace(
          /<svg([^>]*)>/,
          `<svg$1 fill="${color}">`,
        );
      }

      // Устанавливаем заголовки для SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
      res.send(colorizedSvg);
    } catch (error) {
      console.error('Error fetching colorized icon:', error);
      throw new HttpException(
        'Failed to fetch colorized icon',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
