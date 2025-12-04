export interface ExampleMessage {
  id: string;
  payload: string;
  createdAt: string;
}

export const formatMessage = (msg: ExampleMessage): string =>
  `[${msg.createdAt}] (${msg.id}) ${msg.payload}`;

export interface Tank {
  nation?: string;
  type?: string;
  role?: string;
  tier?: number;
  name?: string;
  short_mark?: string;
  tech_name?: string;
  vehicle_cd?: number;
  premium?: boolean;
  collector_vehicle?: boolean;
  earn_crystals?: boolean;
  default_image?: string;
  default_icon?: string;
  special?: boolean;
  contour?: string;
  tank_nations_list?: any[];
  max_health?: number;
  damage1?: number;
  damage_per_minute?: number;
  piercing1?: number;
  piercing2?: number;
  piercing3?: number;
  shot_dispersion_radius?: number;
  aiming_time?: number;
  weight?: number;
  power_weight_ratio?: number;
  speed_forward_kmh?: number;
  chassis_rotation_speed_deg?: number;
  turret_rotation_speed_deg?: number;
  circular_vision_radius?: number;
  max_steering_lock_angle?: number;
  max_steering_lock_angle_wheeled?: number;
  wheeled_switch_on_time?: number;
  wheeled_switch_on_time_wheeled?: number;
  wheeled_switch_off_time?: number;
  wheeled_switch_off_time_wheeled?: number;
  engine_power_hp_rocket_acceleration?: number;
  speed_forward_kmh_rocket_acceleration?: number;
  has_modified_ttc?: boolean;
  applied_modified_ttc?: boolean;
  [key: string]: string | number | boolean | any[] | undefined;
}

// Игровые типы
export interface GameTank {
  id: string;
  tankData: Tank;
  side: 'left' | 'right';
  x: number; // позиция (0-2000)
  health: number;
  maxHealth: number;
  isShooting: boolean;
  targetId: string | null;
  lastShotTime: number;
  fireRate: number; // выстрелов в секунду
  speed: number; // единиц в секунду (скорость в км/ч / 3.6 для перевода в м/с, затем * 1000 для единиц)
}

export interface GameProjectile {
  id: string;
  shooterId: string;
  x: number;
  targetX: number;
  damage: number;
  speed: number; // 1000 единиц в секунду
  createdAt: number;
}

export interface GameState {
  tanks: GameTank[];
  projectiles: GameProjectile[];
  leftRespawnX: number; // 0
  rightRespawnX: number; // 2000
  gameStartTime: number;
  lastSpawnTime: { left: number; right: number };
  isPaused: boolean;
}

export interface GameEvent {
  type: 'tankSpawned' | 'tankMoved' | 'tankShooting' | 'tankStopped' | 'projectileFired' | 'projectileHit' | 'tankDestroyed' | 'gameReset';
  data: any;
  timestamp: number;
}

// Функция для получения URL оригинальной иконки танка
export const getTankIconUrl = (tank: Tank): string | null => {
  const iconPath = tank.contour as string;
  if (!iconPath || typeof iconPath !== 'string') return null;

  const fileName = iconPath.split('/').pop()?.replace(/\.(png|svg)$/, '') || '';
  const tankId = fileName.includes('-') ? fileName.split('-').slice(1).join('-') : fileName;
  const iconId = tankId.toLowerCase();

  return `https://eu-wotp.wgcdn.co/dcont/tankopedia_images/${iconId}/${iconId}_icon.svg`;
};
