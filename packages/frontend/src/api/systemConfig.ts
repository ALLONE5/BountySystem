import apiClient from './client';

export interface SystemConfig {
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
  defaultTheme: 'light' | 'dark';
  allowThemeSwitch: boolean;
  animationStyle: 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple';
  enableAnimations: boolean;
  reducedMotion: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfigUpdate {
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
  defaultTheme?: 'light' | 'dark';
  allowThemeSwitch?: boolean;
  animationStyle?: 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple';
  enableAnimations?: boolean;
  reducedMotion?: boolean;
}

export interface UploadedLogo {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

export const systemConfigApi = {
  // Get current system configuration (requires admin auth)
  async getConfig(): Promise<SystemConfig> {
    const response = await apiClient.get('/admin/system/config');
    return response.data.data;
  },

  // Get public system configuration (no auth required)
  async getPublicConfig(): Promise<{ 
    siteName: string; 
    logoUrl: string; 
    siteDescription: string; 
    debugMode: boolean;
    defaultTheme: 'light' | 'dark';
    allowThemeSwitch: boolean;
    animationStyle: 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple';
    enableAnimations: boolean;
    reducedMotion: boolean;
  }> {
    const response = await apiClient.get('/public/config');
    return response.data.data;
  },

  // Update system configuration
  async updateConfig(updates: SystemConfigUpdate): Promise<SystemConfig> {
    const response = await apiClient.put('/admin/system/config', updates);
    return response.data.data;
  },

  // Check maintenance mode
  async getMaintenanceMode(): Promise<boolean> {
    const response = await apiClient.get('/admin/system/maintenance');
    return response.data.data.maintenanceMode;
  },

  // Check registration allowed
  async getRegistrationAllowed(): Promise<boolean> {
    const response = await apiClient.get('/admin/system/registration');
    return response.data.data.allowRegistration;
  },

  // Get max file size
  async getMaxFileSize(): Promise<number> {
    const response = await apiClient.get('/admin/system/file-size');
    return response.data.data.maxFileSize;
  },

  // Upload logo
  async uploadLogo(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await apiClient.post('/upload/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  // Get uploaded logos
  async getLogos(): Promise<UploadedLogo[]> {
    const response = await apiClient.get('/upload/logos');
    return response.data.data;
  },

  // Delete logo
  async deleteLogo(filename: string): Promise<void> {
    await apiClient.delete(`/upload/logo/${filename}`);
  },
};