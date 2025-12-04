import { Injectable, OnModuleInit } from '@nestjs/common';
import { Tank, GameTank, GameProjectile, GameState, GameEvent } from '@streaming/shared';
import { TanksService } from './tanks.service';

@Injectable()
export class GameService implements OnModuleInit {
  private gameState: GameState;
  private gameLoopInterval: NodeJS.Timeout | null = null;
  private lastUpdateTime: number = 0;
  private isPaused: boolean = false;
  private readonly TICK_RATE = 60; // обновлений в секунду
  private readonly TICK_DELTA = 1000 / this.TICK_RATE; // миллисекунды между тиками
  private readonly MAP_WIDTH = 2000;
  private readonly RESPAWN_DISTANCE = 300; // расстояние до респауна для победы
  private readonly DETECTION_RANGE = 300; // расстояние обнаружения врага
  private readonly SHOOTING_RANGE = 450; // дальность стрельбы
  private readonly PROJECTILE_SPEED = 1000; // единиц в секунду
  private readonly SPAWN_INTERVAL_MIN = 1000; // 1 секунда
  private readonly SPAWN_INTERVAL_MAX = 5000; // 5 секунд

  constructor(private tanksService: TanksService) {
    this.initGame();
  }

  onModuleInit() {
    this.lastUpdateTime = Date.now();
    this.startGameLoop();
  }

  private initGame() {
    this.gameState = {
      tanks: [],
      projectiles: [],
      leftRespawnX: 0,
      rightRespawnX: this.MAP_WIDTH,
      gameStartTime: Date.now(),
      lastSpawnTime: {
        left: Date.now(),
        right: Date.now(),
      },
      isPaused: false,
    };
  }

  private startGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }

    this.gameLoopInterval = setInterval(() => {
      this.updateGame();
    }, this.TICK_DELTA);
  }

  private updateGame() {
    if (this.isPaused) {
      return; // не обновляем игру если пауза
    }

    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // реальное время в секундах
    this.lastUpdateTime = now;

    // Спавн новых танков
    this.spawnTanks(now);

    // Обновление танков
    this.updateTanks(deltaTime);

    // Обновление снарядов
    this.updateProjectiles(deltaTime);

    // Проверка победы
    this.checkVictory();
  }

  private spawnTanks(now: number) {
    const allTanks = this.tanksService.getAllTanks();
    if (allTanks.length === 0) return;

    // Левый респаун
    if (now - this.gameState.lastSpawnTime.left >= this.getRandomSpawnInterval()) {
      const randomTank = allTanks[Math.floor(Math.random() * allTanks.length)];
      this.spawnTank(randomTank, 'left');
      this.gameState.lastSpawnTime.left = now;
    }

    // Правый респаун
    if (now - this.gameState.lastSpawnTime.right >= this.getRandomSpawnInterval()) {
      const randomTank = allTanks[Math.floor(Math.random() * allTanks.length)];
      this.spawnTank(randomTank, 'right');
      this.gameState.lastSpawnTime.right = now;
    }
  }

  private getRandomSpawnInterval(): number {
    return (
      this.SPAWN_INTERVAL_MIN +
      Math.random() * (this.SPAWN_INTERVAL_MAX - this.SPAWN_INTERVAL_MIN)
    );
  }

  private spawnTank(tankData: Tank, side: 'left' | 'right') {
    if (!tankData.max_health || !tankData.damage1 || !tankData.damage_per_minute || !tankData.speed_forward_kmh) {
      return; // пропускаем танки без необходимых данных
    }

    const fireRate = (tankData.damage_per_minute / tankData.damage1) / 60; // выстрелов в секунду
    // Конвертируем км/ч в единицы/сек: если 1000 единиц = 1 км, то 1 км/ч = 1000/3600 единиц/сек = 1/3.6 единиц/сек
    // Используем прямую конвертацию для сохранения пропорций между танками
    const speedKmh = tankData.speed_forward_kmh;
    const speed = speedKmh / 3.6; // единиц в секунду
    
    // Логирование для отладки (можно убрать позже)
    if (this.gameState.tanks.length < 5) {
      console.log(`Spawned tank: ${tankData.name}, speed: ${speedKmh} km/h = ${speed.toFixed(2)} units/sec`);
    }

    const gameTank: GameTank = {
      id: `tank-${Date.now()}-${Math.random()}`,
      tankData,
      side,
      x: side === 'left' ? this.gameState.leftRespawnX : this.gameState.rightRespawnX,
      health: tankData.max_health,
      maxHealth: tankData.max_health,
      isShooting: false,
      targetId: null,
      lastShotTime: 0,
      fireRate,
      speed,
    };

    this.gameState.tanks.push(gameTank);
  }

  private updateTanks(deltaTime: number) {
    for (const tank of this.gameState.tanks) {
      // Поиск врагов
      const enemies = this.findEnemies(tank);

      if (enemies.length > 0) {
        // Есть враги в зоне обнаружения (300)
        const enemiesInRange = enemies.filter((e) => this.getDistance(tank.x, e.x) <= this.SHOOTING_RANGE);

        if (enemiesInRange.length > 0) {
          // Есть враги в зоне стрельбы (450)
          tank.isShooting = true;
          if (!tank.targetId || !enemiesInRange.find((e) => e.id === tank.targetId)) {
            // Выбираем случайного врага в зоне стрельбы
            tank.targetId = enemiesInRange[Math.floor(Math.random() * enemiesInRange.length)].id;
          }

          // Стрельба
          this.handleShooting(tank, enemiesInRange);
        } else {
          // Враги обнаружены, но вне зоны стрельбы - двигаемся
          tank.isShooting = false;
          tank.targetId = null;
          this.moveTank(tank, deltaTime);
        }
      } else {
        // Нет врагов - двигаемся к цели
        tank.isShooting = false;
        tank.targetId = null;
        this.moveTank(tank, deltaTime);
      }
    }
  }

  private findEnemies(tank: GameTank): GameTank[] {
    return this.gameState.tanks.filter((t) => {
      if (t.side === tank.side || t.health <= 0) return false;
      const distance = this.getDistance(tank.x, t.x);
      return distance <= this.DETECTION_RANGE;
    });
  }

  private handleShooting(tank: GameTank, enemies: GameTank[]) {
    const now = Date.now();
    const timeSinceLastShot = (now - tank.lastShotTime) / 1000; // в секундах
    const shotInterval = 1 / tank.fireRate;

    if (timeSinceLastShot >= shotInterval) {
      const target = enemies.find((e) => e.id === tank.targetId) || enemies[0];
      if (target) {
        this.fireProjectile(tank, target);
        tank.lastShotTime = now;
      }
    }
  }

  private fireProjectile(shooter: GameTank, target: GameTank) {
    if (!shooter.tankData.damage1) return;

    const projectile: GameProjectile = {
      id: `proj-${Date.now()}-${Math.random()}`,
      shooterId: shooter.id,
      x: shooter.x,
      targetX: target.x,
      damage: shooter.tankData.damage1,
      speed: this.PROJECTILE_SPEED,
      createdAt: Date.now(),
    };

    this.gameState.projectiles.push(projectile);
  }

  private moveTank(tank: GameTank, deltaTime: number) {
    if (tank.isShooting) return; // не двигаемся во время стрельбы

    const direction = tank.side === 'left' ? 1 : -1;
    const distance = tank.speed * deltaTime;
    tank.x += distance * direction;

    // Ограничиваем позицию
    tank.x = Math.max(this.gameState.leftRespawnX, Math.min(this.gameState.rightRespawnX, tank.x));
  }

  private updateProjectiles(deltaTime: number) {
    const now = Date.now();
    const projectilesToRemove: string[] = [];

    for (const projectile of this.gameState.projectiles) {
      const shooter = this.gameState.tanks.find((t) => t.id === projectile.shooterId);
      if (!shooter) {
        projectilesToRemove.push(projectile.id);
        continue;
      }

      // Движение снаряда к цели
      const direction = projectile.targetX > projectile.x ? 1 : -1;
      const distance = projectile.speed * deltaTime;
      projectile.x += distance * direction;

      // Проверка попадания
      const enemies = this.gameState.tanks.filter(
        (t) => t.side !== shooter.side && t.health > 0,
      );

      for (const enemy of enemies) {
        const distanceToEnemy = Math.abs(projectile.x - enemy.x);
        if (distanceToEnemy < 50) {
          // Попадание (радиус 50 единиц)
          enemy.health = Math.max(0, enemy.health - projectile.damage);
          projectilesToRemove.push(projectile.id);

          if (enemy.health <= 0) {
            // Танк уничтожен
            this.removeTank(enemy.id);
          }
          break;
        }
      }

      // Удаляем снаряды, которые улетели за пределы карты
      if (projectile.x < -100 || projectile.x > this.MAP_WIDTH + 100) {
        projectilesToRemove.push(projectile.id);
      }
    }

    // Удаляем обработанные снаряды
    this.gameState.projectiles = this.gameState.projectiles.filter(
      (p) => !projectilesToRemove.includes(p.id),
    );
  }

  private removeTank(tankId: string) {
    this.gameState.tanks = this.gameState.tanks.filter((t) => t.id !== tankId);
    // Удаляем снаряды этого танка
    this.gameState.projectiles = this.gameState.projectiles.filter(
      (p) => p.shooterId !== tankId,
    );
  }

  private checkVictory() {
    // Проверяем, достиг ли кто-то вражеского респауна
    const leftTanks = this.gameState.tanks.filter((t) => t.side === 'left' && t.health > 0);
    const rightTanks = this.gameState.tanks.filter((t) => t.side === 'right' && t.health > 0);

    let victory = false;

    // Проверяем левых танков
    for (const tank of leftTanks) {
      const distanceToRightRespawn = this.gameState.rightRespawnX - tank.x;
      if (distanceToRightRespawn <= this.RESPAWN_DISTANCE) {
        victory = true;
        break;
      }
    }

    // Проверяем правых танков
    if (!victory) {
      for (const tank of rightTanks) {
        const distanceToLeftRespawn = tank.x - this.gameState.leftRespawnX;
        if (distanceToLeftRespawn <= this.RESPAWN_DISTANCE) {
          victory = true;
          break;
        }
      }
    }

    if (victory) {
      this.resetGame();
    }
  }

  private resetGame() {
    // Очищаем все танки и снаряды
    this.gameState.tanks = [];
    this.gameState.projectiles = [];
    this.gameState.gameStartTime = Date.now();
    this.gameState.lastSpawnTime = {
      left: Date.now(),
      right: Date.now(),
    };
  }

  private getDistance(x1: number, x2: number): number {
    return Math.abs(x1 - x2);
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    this.gameState.isPaused = this.isPaused;
    if (!this.isPaused) {
      // Обновляем время при снятии паузы
      this.lastUpdateTime = Date.now();
    }
  }

  getGameState(): GameState {
    const state = JSON.parse(JSON.stringify(this.gameState)); // глубокое копирование
    state.isPaused = this.isPaused; // убеждаемся что пауза синхронизирована
    return state;
  }

  onModuleDestroy() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
  }
}

