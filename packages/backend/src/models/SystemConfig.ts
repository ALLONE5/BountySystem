export interface SystemConfig {
  id: string;
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
  maxFileSize: number; // MB
  defaultUserRole: string;
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  // UI Theme Configuration
  defaultTheme: 'light' | 'dark' | 'cyberpunk';
  allowThemeSwitch: boolean;
  animationStyle: 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple' | 'cyberpunk' | 'matrix';
  enableAnimations: boolean;
  reducedMotion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfigCreateDTO {
  siteName: string;
  siteDescription?: string;
  logoUrl?: string;
  allowRegistration?: boolean;
  maintenanceMode?: boolean;
  debugMode?: boolean;
  maxFileSize?: number;
  defaultUserRole?: string;
  emailEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  // UI Theme Configuration
  defaultTheme?: 'light' | 'dark' | 'cyberpunk';
  allowThemeSwitch?: boolean;
  animationStyle?: 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple' | 'cyberpunk' | 'matrix';
  enableAnimations?: boolean;
  reducedMotion?: boolean;
}

export interface SystemConfigUpdateDTO {
  siteName?: string;
  siteDescription?: string;
  logoUrl?: string;
  allowRegistration?: boolean;
  maintenanceMode?: boolean;
  debugMode?: boolean;
  maxFileSize?: number;
  defaultUserRole?: string;
  emailEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  // UI Theme Configuration
  defaultTheme?: 'light' | 'dark' | 'cyberpunk';
  allowThemeSwitch?: boolean;
  animationStyle?: 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple' | 'cyberpunk' | 'matrix';
  enableAnimations?: boolean;
  reducedMotion?: boolean;
}

export interface SystemConfigResponse {
  id: string;
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
  maxFileSize: number;
  defaultUserRole: string;
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecure: boolean;
  // UI Theme Configuration
  defaultTheme: 'light' | 'dark' | 'cyberpunk';
  allowThemeSwitch: boolean;
  animationStyle: 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple' | 'cyberpunk' | 'matrix';
  enableAnimations: boolean;
  reducedMotion: boolean;
  createdAt: Date;
  updatedAt: Date;
}