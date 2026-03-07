import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { 
  SystemConfig, 
  SystemConfigCreateDTO, 
  SystemConfigUpdateDTO, 
  SystemConfigResponse 
} from '../models/SystemConfig.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { Validator } from '../utils/Validator.js';

export class SystemConfigService {
  /**
   * Get current system configuration
   */
  async getConfig(): Promise<SystemConfigResponse> {
    const query = `
      SELECT 
        id,
        site_name as "siteName",
        site_description as "siteDescription", 
        logo_url as "logoUrl",
        allow_registration as "allowRegistration",
        maintenance_mode as "maintenanceMode",
        debug_mode as "debugMode",
        max_file_size as "maxFileSize",
        default_user_role as "defaultUserRole",
        email_enabled as "emailEnabled",
        smtp_host as "smtpHost",
        smtp_port as "smtpPort",
        smtp_user as "smtpUser",
        smtp_secure as "smtpSecure",
        default_theme as "defaultTheme",
        allow_theme_switch as "allowThemeSwitch",
        animation_style as "animationStyle",
        enable_animations as "enableAnimations",
        reduced_motion as "reducedMotion",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM system_config 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('System configuration not found');
    }

    // Don't return sensitive SMTP password
    const config = result.rows[0];
    return {
      ...config,
      smtpPassword: config.smtpPassword ? '***' : ''
    };
  }

  /**
   * Get public system configuration (no authentication required)
   * Returns only basic information like site name, logo, debug mode, and theme settings
   */
  async getPublicConfig(): Promise<{ 
    siteName: string; 
    logoUrl: string; 
    siteDescription: string; 
    debugMode: boolean;
    defaultTheme: 'light' | 'dark';
    allowThemeSwitch: boolean;
    animationStyle: 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple' | 'matrix';
    enableAnimations: boolean;
    reducedMotion: boolean;
  }> {
    const query = `
      SELECT 
        site_name as "siteName",
        site_description as "siteDescription", 
        logo_url as "logoUrl",
        debug_mode as "debugMode",
        default_theme as "defaultTheme",
        allow_theme_switch as "allowThemeSwitch",
        animation_style as "animationStyle",
        enable_animations as "enableAnimations",
        reduced_motion as "reducedMotion"
      FROM system_config 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      // Return default values if no config exists
      return {
        siteName: '赏金猎人平台',
        siteDescription: '基于任务的协作平台',
        logoUrl: '',
        debugMode: false,
        defaultTheme: 'dark',
        allowThemeSwitch: true,
        animationStyle: 'minimal',
        enableAnimations: true,
        reducedMotion: false,
      };
    }

    return result.rows[0];
  }

  /**
   * Update system configuration
   */
  async updateConfig(updates: SystemConfigUpdateDTO): Promise<SystemConfigResponse> {
    logger.debug('updateConfig called', { updates });
    
    // Validate input
    this.validateConfigData(updates);

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    if (updates.siteName !== undefined) {
      fields.push(`site_name = $${paramCount++}`);
      values.push(updates.siteName);
    }

    if (updates.siteDescription !== undefined) {
      fields.push(`site_description = $${paramCount++}`);
      values.push(updates.siteDescription);
    }

    if (updates.logoUrl !== undefined) {
      fields.push(`logo_url = $${paramCount++}`);
      values.push(updates.logoUrl);
    }

    if (updates.allowRegistration !== undefined) {
      fields.push(`allow_registration = $${paramCount++}`);
      values.push(updates.allowRegistration);
    }

    if (updates.maintenanceMode !== undefined) {
      fields.push(`maintenance_mode = $${paramCount++}`);
      values.push(updates.maintenanceMode);
    }

    if (updates.debugMode !== undefined) {
      fields.push(`debug_mode = $${paramCount++}`);
      values.push(updates.debugMode);
      logger.debug('Debug mode update', { debugMode: updates.debugMode });
    }

    if (updates.maxFileSize !== undefined) {
      fields.push(`max_file_size = $${paramCount++}`);
      values.push(updates.maxFileSize);
    }

    if (updates.defaultUserRole !== undefined) {
      fields.push(`default_user_role = $${paramCount++}`);
      values.push(updates.defaultUserRole);
    }

    if (updates.emailEnabled !== undefined) {
      fields.push(`email_enabled = $${paramCount++}`);
      values.push(updates.emailEnabled);
    }

    if (updates.smtpHost !== undefined) {
      fields.push(`smtp_host = $${paramCount++}`);
      values.push(updates.smtpHost);
    }

    if (updates.smtpPort !== undefined) {
      fields.push(`smtp_port = $${paramCount++}`);
      values.push(updates.smtpPort);
    }

    if (updates.smtpUser !== undefined) {
      fields.push(`smtp_user = $${paramCount++}`);
      values.push(updates.smtpUser);
    }

    if (updates.smtpPassword !== undefined) {
      fields.push(`smtp_password = $${paramCount++}`);
      values.push(updates.smtpPassword);
    }

    if (updates.smtpSecure !== undefined) {
      fields.push(`smtp_secure = $${paramCount++}`);
      values.push(updates.smtpSecure);
    }

    // UI Theme fields
    if (updates.defaultTheme !== undefined) {
      fields.push(`default_theme = $${paramCount++}`);
      values.push(updates.defaultTheme);
    }

    if (updates.allowThemeSwitch !== undefined) {
      fields.push(`allow_theme_switch = $${paramCount++}`);
      values.push(updates.allowThemeSwitch);
    }

    if (updates.animationStyle !== undefined) {
      fields.push(`animation_style = $${paramCount++}`);
      values.push(updates.animationStyle);
    }

    if (updates.enableAnimations !== undefined) {
      fields.push(`enable_animations = $${paramCount++}`);
      values.push(updates.enableAnimations);
    }

    if (updates.reducedMotion !== undefined) {
      fields.push(`reduced_motion = $${paramCount++}`);
      values.push(updates.reducedMotion);
    }

    if (fields.length === 0) {
      // No updates, return current config
      return this.getConfig();
    }

    // Add updated_at field
    fields.push(`updated_at = NOW()`);

    logger.debug('SQL preparation', {
      fields: fields.slice(0, -1), // 排除 updated_at
      valuesCount: values.length
    });

    const query = `
      UPDATE system_config 
      SET ${fields.join(', ')}
      WHERE id = (SELECT id FROM system_config ORDER BY created_at DESC LIMIT 1)
      RETURNING 
        id,
        site_name as "siteName",
        site_description as "siteDescription", 
        logo_url as "logoUrl",
        allow_registration as "allowRegistration",
        maintenance_mode as "maintenanceMode",
        debug_mode as "debugMode",
        max_file_size as "maxFileSize",
        default_user_role as "defaultUserRole",
        email_enabled as "emailEnabled",
        smtp_host as "smtpHost",
        smtp_port as "smtpPort",
        smtp_user as "smtpUser",
        smtp_secure as "smtpSecure",
        default_theme as "defaultTheme",
        allow_theme_switch as "allowThemeSwitch",
        animation_style as "animationStyle",
        enable_animations as "enableAnimations",
        reduced_motion as "reducedMotion",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    logger.debug('Executing SQL query', {
      query: query.substring(0, 100) + '...',
      paramsCount: values.length
    });

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('System configuration not found');
    }

    // Don't return sensitive SMTP password
    const config = result.rows[0];
    return {
      ...config,
      smtpPassword: config.smtpPassword ? '***' : ''
    };
  }

  /**
   * Create initial system configuration
   */
  async createConfig(configData: SystemConfigCreateDTO): Promise<SystemConfigResponse> {
    this.validateConfigData(configData);

    const query = `
      INSERT INTO system_config (
        site_name,
        site_description,
        logo_url,
        allow_registration,
        maintenance_mode,
        debug_mode,
        max_file_size,
        default_user_role,
        email_enabled,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password,
        smtp_secure,
        default_theme,
        allow_theme_switch,
        animation_style,
        enable_animations,
        reduced_motion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING 
        id,
        site_name as "siteName",
        site_description as "siteDescription", 
        logo_url as "logoUrl",
        allow_registration as "allowRegistration",
        maintenance_mode as "maintenanceMode",
        debug_mode as "debugMode",
        max_file_size as "maxFileSize",
        default_user_role as "defaultUserRole",
        email_enabled as "emailEnabled",
        smtp_host as "smtpHost",
        smtp_port as "smtpPort",
        smtp_user as "smtpUser",
        smtp_secure as "smtpSecure",
        default_theme as "defaultTheme",
        allow_theme_switch as "allowThemeSwitch",
        animation_style as "animationStyle",
        enable_animations as "enableAnimations",
        reduced_motion as "reducedMotion",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      configData.siteName || '赏金猎人平台',
      configData.siteDescription || '基于任务的协作平台',
      configData.logoUrl || '',
      configData.allowRegistration ?? true,
      configData.maintenanceMode ?? false,
      configData.debugMode ?? false,
      configData.maxFileSize || 10,
      configData.defaultUserRole || 'user',
      configData.emailEnabled ?? false,
      configData.smtpHost || '',
      configData.smtpPort || 587,
      configData.smtpUser || '',
      configData.smtpPassword || '',
      configData.smtpSecure ?? true,
      configData.defaultTheme || 'dark',
      configData.allowThemeSwitch ?? true,
      configData.animationStyle || 'minimal',
      configData.enableAnimations ?? true,
      configData.reducedMotion ?? false
    ];

    const result = await pool.query(query, values);
    
    // Don't return sensitive SMTP password
    const config = result.rows[0];
    return {
      ...config,
      smtpPassword: config.smtpPassword ? '***' : ''
    };
  }

  /**
   * Check if system is in maintenance mode
   */
  async isMaintenanceMode(): Promise<boolean> {
    const query = `
      SELECT maintenance_mode 
      FROM system_config 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await pool.query(query);
    return result.rows.length > 0 ? result.rows[0].maintenance_mode : false;
  }

  /**
   * Check if user registration is allowed
   */
  async isRegistrationAllowed(): Promise<boolean> {
    const query = `
      SELECT allow_registration 
      FROM system_config 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await pool.query(query);
    return result.rows.length > 0 ? result.rows[0].allow_registration : true;
  }

  /**
   * Get maximum file upload size
   */
  async getMaxFileSize(): Promise<number> {
    const query = `
      SELECT max_file_size 
      FROM system_config 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await pool.query(query);
    return result.rows.length > 0 ? result.rows[0].max_file_size : 10;
  }

  /**
   * Validate configuration data
   */
  private validateConfigData(data: SystemConfigCreateDTO | SystemConfigUpdateDTO): void {
    if (data.siteName !== undefined) {
      Validator.minLength(data.siteName, 1, 'Site name');
      Validator.maxLength(data.siteName, 255, 'Site name');
    }

    if (data.siteDescription !== undefined) {
      Validator.maxLength(data.siteDescription, 1000, 'Site description');
    }

    if (data.logoUrl !== undefined) {
      Validator.maxLength(data.logoUrl, 500, 'Logo URL');
    }

    if (data.maxFileSize !== undefined) {
      Validator.min(data.maxFileSize, 1, 'Max file size');
      Validator.max(data.maxFileSize, 100, 'Max file size');
    }

    if (data.defaultUserRole !== undefined) {
      const validRoles = ['user', 'position_admin', 'super_admin'];
      if (!validRoles.includes(data.defaultUserRole)) {
        throw new ValidationError('Invalid default user role');
      }
    }

    if (data.smtpPort !== undefined) {
      Validator.min(data.smtpPort, 1, 'SMTP port');
      Validator.max(data.smtpPort, 65535, 'SMTP port');
    }

    if (data.smtpHost !== undefined) {
      Validator.maxLength(data.smtpHost, 255, 'SMTP host');
    }

    if (data.smtpUser !== undefined) {
      Validator.maxLength(data.smtpUser, 255, 'SMTP user');
    }

    if (data.smtpPassword !== undefined) {
      Validator.maxLength(data.smtpPassword, 255, 'SMTP password');
    }

    // UI Theme validation
    if (data.defaultTheme !== undefined) {
      const validThemes = ['light', 'dark'];
      if (!validThemes.includes(data.defaultTheme)) {
        throw new ValidationError('Invalid default theme');
      }
    }

    if (data.animationStyle !== undefined) {
      const validAnimationStyles = ['none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'matrix'];
      if (!validAnimationStyles.includes(data.animationStyle)) {
        throw new ValidationError('Invalid animation style');
      }
    }
  }
}