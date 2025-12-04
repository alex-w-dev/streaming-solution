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
