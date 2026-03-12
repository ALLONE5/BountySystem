import { EventEmitter } from 'events';
import { logger } from '../config/logger';
import { RealTimeMetrics } from './RealTimeMetrics';

/**
 * 告警级别
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 告警类型
 */
export enum AlertType {
  API_RESPONSE_TIME = 'api_response_time',
  API_ERROR_RATE = 'api_error_rate',
  CACHE_HIT_RATE = 'cache_hit_rate',
  DATABASE_QUERY_TIME = 'database_query_time',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  ACTIVE_REQUESTS = 'active_requests'
}

/**
 * 告警信息
 */
export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * 告警规则
 */
export interface AlertRule {
  type: AlertType;
  enabled: boolean;
  threshold: number;
  level: AlertLevel;
  message: string;
  cooldownMs: number; // 冷却时间，避免重复告警
}

/**
 * 性能告警服务
 * 监控性能指标并触发告警
 */
export class PerformanceAlertService extends EventEmitter {
  private static instance: PerformanceAlertService;
  
  // 告警历史
  private alerts: Alert[] = [];
  private readonly maxAlertsHistory = 1000;
  
  // 活跃告警（未解决）
  private activeAlerts: Map<AlertType, Alert> = new Map();
  
  // 最后告警时间（用于冷却）
  private lastAlertTime: Map<AlertType, number> = new Map();

  // 默认告警规则
  private rules: Map<AlertType, AlertRule> = new Map([
    [AlertType.API_RESPONSE_TIME, {
      type: AlertType.API_RESPONSE_TIME,
      enabled: true,
      threshold: 1000, // 1秒
      level: AlertLevel.WARNING,
      message: 'API 平均响应时间超过阈值',
      cooldownMs: 60000 // 1分钟
    }],
    [AlertType.API_ERROR_RATE, {
      type: AlertType.API_ERROR_RATE,
      enabled: true,
      threshold: 5, // 5%
      level: AlertLevel.ERROR,
      message: 'API 错误率超过阈值',
      cooldownMs: 60000
    }],
    [AlertType.CACHE_HIT_RATE, {
      type: AlertType.CACHE_HIT_RATE,
      enabled: true,
      threshold: 50, // 50%
      level: AlertLevel.WARNING,
      message: '缓存命中率低于阈值',
      cooldownMs: 300000 // 5分钟
    }],
    [AlertType.DATABASE_QUERY_TIME, {
      type: AlertType.DATABASE_QUERY_TIME,
      enabled: true,
      threshold: 500, // 500ms
      level: AlertLevel.WARNING,
      message: '数据库平均查询时间超过阈值',
      cooldownMs: 60000
    }],
    [AlertType.MEMORY_USAGE, {
      type: AlertType.MEMORY_USAGE,
      enabled: true,
      threshold: 80, // 80%
      level: AlertLevel.ERROR,
      message: '内存使用率超过阈值',
      cooldownMs: 300000
    }],
    [AlertType.CPU_USAGE, {
      type: AlertType.CPU_USAGE,
      enabled: true,
      threshold: 80, // 80%
      level: AlertLevel.WARNING,
      message: 'CPU 使用率超过阈值',
      cooldownMs: 300000
    }],
    [AlertType.ACTIVE_REQUESTS, {
      type: AlertType.ACTIVE_REQUESTS,
      enabled: true,
      threshold: 100, // 100个并发请求
      level: AlertLevel.WARNING,
      message: '活跃请求数超过阈值',
      cooldownMs: 60000
    }]
  ]);

  private constructor() {
    super();
  }

  static getInstance(): PerformanceAlertService {
    if (!PerformanceAlertService.instance) {
      PerformanceAlertService.instance = new PerformanceAlertService();
    }
    return PerformanceAlertService.instance;
  }

  /**
   * 检查指标并触发告警
   */
  checkMetrics(metrics: RealTimeMetrics): void {
    // 检查 API 响应时间
    this.checkThreshold(
      AlertType.API_RESPONSE_TIME,
      metrics.api.avgResponseTime,
      (value, threshold) => value > threshold
    );

    // 检查 API 错误率
    this.checkThreshold(
      AlertType.API_ERROR_RATE,
      metrics.api.errorRate,
      (value, threshold) => value > threshold
    );

    // 检查缓存命中率
    this.checkThreshold(
      AlertType.CACHE_HIT_RATE,
      metrics.cache.hitRate,
      (value, threshold) => value < threshold // 注意：低于阈值才告警
    );

    // 检查数据库查询时间
    this.checkThreshold(
      AlertType.DATABASE_QUERY_TIME,
      metrics.database.avgQueryTime,
      (value, threshold) => value > threshold
    );

    // 检查内存使用率
    this.checkThreshold(
      AlertType.MEMORY_USAGE,
      metrics.system.memoryUsage,
      (value, threshold) => value > threshold
    );

    // 检查 CPU 使用率
    this.checkThreshold(
      AlertType.CPU_USAGE,
      metrics.system.cpuUsage,
      (value, threshold) => value > threshold
    );

    // 检查活跃请求数
    this.checkThreshold(
      AlertType.ACTIVE_REQUESTS,
      metrics.api.activeRequests,
      (value, threshold) => value > threshold
    );
  }

  /**
   * 检查阈值
   */
  private checkThreshold(
    type: AlertType,
    value: number,
    condition: (value: number, threshold: number) => boolean
  ): void {
    const rule = this.rules.get(type);
    
    if (!rule || !rule.enabled) {
      return;
    }

    const shouldAlert = condition(value, rule.threshold);
    const activeAlert = this.activeAlerts.get(type);

    if (shouldAlert) {
      // 需要告警
      if (!activeAlert) {
        // 检查冷却时间
        const lastAlertTime = this.lastAlertTime.get(type) || 0;
        const now = Date.now();
        
        if (now - lastAlertTime < rule.cooldownMs) {
          return; // 还在冷却期
        }

        // 创建新告警
        this.createAlert(type, rule, value);
      }
    } else {
      // 不需要告警，解决活跃告警
      if (activeAlert && !activeAlert.resolved) {
        this.resolveAlert(activeAlert);
      }
    }
  }

  /**
   * 创建告警
   */
  private createAlert(type: AlertType, rule: AlertRule, value: number): void {
    const alert: Alert = {
      id: `${type}_${Date.now()}`,
      type,
      level: rule.level,
      message: `${rule.message}: ${value.toFixed(2)} (阈值: ${rule.threshold})`,
      value,
      threshold: rule.threshold,
      timestamp: Date.now(),
      resolved: false
    };

    // 保存到历史
    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts.shift();
    }

    // 添加到活跃告警
    this.activeAlerts.set(type, alert);
    
    // 更新最后告警时间
    this.lastAlertTime.set(type, Date.now());

    // 记录日志
    logger.warn(`性能告警 [${alert.level}]:`, alert.message);

    // 发送告警事件
    this.emit('alert', alert);
  }

  /**
   * 解决告警
   */
  private resolveAlert(alert: Alert): void {
    alert.resolved = true;
    alert.resolvedAt = Date.now();
    
    // 从活跃告警中移除
    this.activeAlerts.delete(alert.type);

    // 记录日志
    logger.info(`性能告警已解决 [${alert.type}]:`, alert.message);

    // 发送解决事件
    this.emit('alert-resolved', alert);
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * 获取告警历史
   * @param minutes 获取最近N分钟的告警
   */
  getAlertHistory(minutes: number = 60): Alert[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.alerts.filter(a => a.timestamp > cutoffTime);
  }

  /**
   * 获取告警统计
   * @param minutes 统计最近N分钟的告警
   */
  getAlertStats(minutes: number = 60): {
    total: number;
    byLevel: Record<AlertLevel, number>;
    byType: Record<AlertType, number>;
    resolved: number;
    active: number;
  } {
    const history = this.getAlertHistory(minutes);
    
    const stats = {
      total: history.length,
      byLevel: {
        [AlertLevel.INFO]: 0,
        [AlertLevel.WARNING]: 0,
        [AlertLevel.ERROR]: 0,
        [AlertLevel.CRITICAL]: 0
      },
      byType: {} as Record<AlertType, number>,
      resolved: 0,
      active: 0
    };

    history.forEach(alert => {
      stats.byLevel[alert.level]++;
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      
      if (alert.resolved) {
        stats.resolved++;
      } else {
        stats.active++;
      }
    });

    return stats;
  }

  /**
   * 更新告警规则
   */
  updateRule(type: AlertType, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(type);
    
    if (!rule) {
      logger.warn(`告警规则不存在: ${type}`);
      return;
    }

    Object.assign(rule, updates);
    logger.info(`告警规则已更新: ${type}`, updates);
  }

  /**
   * 获取告警规则
   */
  getRule(type: AlertType): AlertRule | undefined {
    return this.rules.get(type);
  }

  /**
   * 获取所有告警规则
   */
  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 启用/禁用告警规则
   */
  setRuleEnabled(type: AlertType, enabled: boolean): void {
    const rule = this.rules.get(type);
    
    if (!rule) {
      logger.warn(`告警规则不存在: ${type}`);
      return;
    }

    rule.enabled = enabled;
    logger.info(`告警规则已${enabled ? '启用' : '禁用'}: ${type}`);
  }

  /**
   * 手动解决告警
   */
  manualResolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (!alert) {
      return false;
    }

    if (!alert.resolved) {
      this.resolveAlert(alert);
    }

    return true;
  }

  /**
   * 清除告警历史
   */
  clearHistory(): void {
    this.alerts = [];
    logger.info('告警历史已清除');
  }
}
