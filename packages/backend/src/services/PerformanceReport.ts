import { logger } from '../config/logger';
import { RealTimeMetricsService } from './RealTimeMetrics';
import { CacheMonitorService } from './CacheMonitor';
import { PerformanceAlertService, AlertLevel } from './PerformanceAlert';

/**
 * 报告类型
 */
export enum ReportType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * 性能报告
 */
export interface PerformanceReport {
  type: ReportType;
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    avgDbQueryTime: number;
  };
  trends: {
    responseTime: { improving: boolean; change: number };
    errorRate: { improving: boolean; change: number };
    cacheHitRate: { improving: boolean; change: number };
  };
  alerts: {
    total: number;
    critical: number;
    error: number;
    warning: number;
  };
  recommendations: string[];
  generatedAt: number;
}

/**
 * 性能报告服务
 * 生成定期性能报告
 */
export class PerformanceReportService {
  private static instance: PerformanceReportService;
  
  // 报告历史
  private reports: PerformanceReport[] = [];
  private readonly maxReportsHistory = 100;
  
  // 定时任务
  private scheduledTasks: Map<ReportType, NodeJS.Timeout> = new Map();

  private constructor(
    private metricsService: RealTimeMetricsService,
    private cacheMonitor: CacheMonitorService,
    private alertService: PerformanceAlertService
  ) {}

  static getInstance(
    metricsService: RealTimeMetricsService,
    cacheMonitor: CacheMonitorService,
    alertService: PerformanceAlertService
  ): PerformanceReportService {
    if (!PerformanceReportService.instance) {
      PerformanceReportService.instance = new PerformanceReportService(
        metricsService,
        cacheMonitor,
        alertService
      );
    }
    return PerformanceReportService.instance;
  }

  /**
   * 生成性能报告
   */
  async generateReport(type: ReportType): Promise<PerformanceReport> {
    const period = this.getReportPeriod(type);
    const minutes = Math.floor((period.end - period.start) / 60000);

    // 获取指标数据
    const metricsHistory = this.metricsService.getHistoricalMetrics(minutes);
    const metricsStats = this.metricsService.getMetricsStats(minutes);
    const cacheMetrics = await this.cacheMonitor.getMetrics();
    const alertStats = this.alertService.getAlertStats(minutes);

    // 计算汇总数据
    const summary = this.calculateSummary(metricsHistory, cacheMetrics);
    
    // 计算趋势
    const trends = this.calculateTrends(metricsHistory, type);
    
    // 生成建议
    const recommendations = this.generateRecommendations(
      summary,
      trends,
      alertStats
    );

    const report: PerformanceReport = {
      type,
      period,
      summary,
      trends,
      alerts: {
        total: alertStats.total,
        critical: alertStats.byLevel[AlertLevel.CRITICAL] || 0,
        error: alertStats.byLevel[AlertLevel.ERROR] || 0,
        warning: alertStats.byLevel[AlertLevel.WARNING] || 0
      },
      recommendations,
      generatedAt: Date.now()
    };

    // 保存报告
    this.reports.push(report);
    if (this.reports.length > this.maxReportsHistory) {
      this.reports.shift();
    }

    logger.info(`性能报告已生成: ${type}`);

    return report;
  }

  /**
   * 获取报告周期
   */
  private getReportPeriod(type: ReportType): { start: number; end: number } {
    const end = Date.now();
    let start: number;

    switch (type) {
      case ReportType.HOURLY:
        start = end - (60 * 60 * 1000); // 1小时
        break;
      case ReportType.DAILY:
        start = end - (24 * 60 * 60 * 1000); // 24小时
        break;
      case ReportType.WEEKLY:
        start = end - (7 * 24 * 60 * 60 * 1000); // 7天
        break;
      case ReportType.MONTHLY:
        start = end - (30 * 24 * 60 * 60 * 1000); // 30天
        break;
      default:
        start = end - (60 * 60 * 1000);
    }

    return { start, end };
  }

  /**
   * 计算汇总数据
   */
  private calculateSummary(metricsHistory: any[], cacheMetrics: any) {
    if (metricsHistory.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        avgDbQueryTime: 0
      };
    }

    const totalRequests = metricsHistory.reduce(
      (sum, m) => sum + m.api.requestsPerSecond,
      0
    );

    const avgResponseTime = metricsHistory.reduce(
      (sum, m) => sum + m.api.avgResponseTime,
      0
    ) / metricsHistory.length;

    const avgErrorRate = metricsHistory.reduce(
      (sum, m) => sum + m.api.errorRate,
      0
    ) / metricsHistory.length;

    const avgDbQueryTime = metricsHistory.reduce(
      (sum, m) => sum + m.database.avgQueryTime,
      0
    ) / metricsHistory.length;

    return {
      totalRequests: Math.round(totalRequests),
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: Math.round(avgErrorRate * 100) / 100,
      cacheHitRate: Math.round(cacheMetrics.hitRate * 100) / 100,
      avgDbQueryTime: Math.round(avgDbQueryTime * 100) / 100
    };
  }

  /**
   * 计算趋势
   */
  private calculateTrends(metricsHistory: any[], type: ReportType) {
    if (metricsHistory.length < 2) {
      return {
        responseTime: { improving: false, change: 0 },
        errorRate: { improving: false, change: 0 },
        cacheHitRate: { improving: false, change: 0 }
      };
    }

    // 将数据分为前半部分和后半部分
    const midPoint = Math.floor(metricsHistory.length / 2);
    const firstHalf = metricsHistory.slice(0, midPoint);
    const secondHalf = metricsHistory.slice(midPoint);

    // 计算平均值
    const firstAvgResponseTime = firstHalf.reduce(
      (sum, m) => sum + m.api.avgResponseTime, 0
    ) / firstHalf.length;
    
    const secondAvgResponseTime = secondHalf.reduce(
      (sum, m) => sum + m.api.avgResponseTime, 0
    ) / secondHalf.length;

    const firstAvgErrorRate = firstHalf.reduce(
      (sum, m) => sum + m.api.errorRate, 0
    ) / firstHalf.length;
    
    const secondAvgErrorRate = secondHalf.reduce(
      (sum, m) => sum + m.api.errorRate, 0
    ) / secondHalf.length;

    const firstAvgCacheHitRate = firstHalf.reduce(
      (sum, m) => sum + m.cache.hitRate, 0
    ) / firstHalf.length;
    
    const secondAvgCacheHitRate = secondHalf.reduce(
      (sum, m) => sum + m.cache.hitRate, 0
    ) / secondHalf.length;

    // 计算变化
    const responseTimeChange = ((secondAvgResponseTime - firstAvgResponseTime) / firstAvgResponseTime) * 100;
    const errorRateChange = ((secondAvgErrorRate - firstAvgErrorRate) / (firstAvgErrorRate || 1)) * 100;
    const cacheHitRateChange = ((secondAvgCacheHitRate - firstAvgCacheHitRate) / (firstAvgCacheHitRate || 1)) * 100;

    return {
      responseTime: {
        improving: responseTimeChange < 0,
        change: Math.round(Math.abs(responseTimeChange) * 100) / 100
      },
      errorRate: {
        improving: errorRateChange < 0,
        change: Math.round(Math.abs(errorRateChange) * 100) / 100
      },
      cacheHitRate: {
        improving: cacheHitRateChange > 0,
        change: Math.round(Math.abs(cacheHitRateChange) * 100) / 100
      }
    };
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    summary: any,
    trends: any,
    alertStats: any
  ): string[] {
    const recommendations: string[] = [];

    // 响应时间建议
    if (summary.avgResponseTime > 500) {
      recommendations.push('API 平均响应时间较高，建议优化慢接口或增加缓存');
    }
    if (!trends.responseTime.improving && trends.responseTime.change > 10) {
      recommendations.push(`响应时间呈上升趋势（+${trends.responseTime.change}%），需要关注性能退化`);
    }

    // 错误率建议
    if (summary.errorRate > 1) {
      recommendations.push('错误率偏高，建议检查错误日志并修复问题');
    }
    if (!trends.errorRate.improving && trends.errorRate.change > 20) {
      recommendations.push(`错误率显著上升（+${trends.errorRate.change}%），需要立即处理`);
    }

    // 缓存命中率建议
    if (summary.cacheHitRate < 70) {
      recommendations.push('缓存命中率较低，建议优化缓存策略或增加预热');
    }
    if (!trends.cacheHitRate.improving && trends.cacheHitRate.change > 10) {
      recommendations.push(`缓存命中率下降（-${trends.cacheHitRate.change}%），建议检查缓存配置`);
    }

    // 数据库查询建议
    if (summary.avgDbQueryTime > 100) {
      recommendations.push('数据库查询时间较长，建议添加索引或优化查询');
    }

    // 告警建议
    if (alertStats.critical > 0) {
      recommendations.push(`存在 ${alertStats.critical} 个严重告警，需要立即处理`);
    }
    if (alertStats.error > 5) {
      recommendations.push(`错误告警较多（${alertStats.error} 个），建议优先处理`);
    }

    // 如果一切正常
    if (recommendations.length === 0) {
      recommendations.push('系统运行良好，各项指标正常');
    }

    return recommendations;
  }

  /**
   * 格式化报告为文本
   */
  formatReportAsText(report: PerformanceReport): string {
    const periodStart = new Date(report.period.start).toLocaleString('zh-CN');
    const periodEnd = new Date(report.period.end).toLocaleString('zh-CN');

    let text = `=== 性能报告 (${report.type}) ===\n\n`;
    text += `报告周期: ${periodStart} - ${periodEnd}\n`;
    text += `生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}\n\n`;

    text += '--- 性能汇总 ---\n';
    text += `总请求数: ${report.summary.totalRequests}\n`;
    text += `平均响应时间: ${report.summary.avgResponseTime}ms\n`;
    text += `错误率: ${report.summary.errorRate}%\n`;
    text += `缓存命中率: ${report.summary.cacheHitRate}%\n`;
    text += `平均数据库查询时间: ${report.summary.avgDbQueryTime}ms\n\n`;

    text += '--- 性能趋势 ---\n';
    text += `响应时间: ${report.trends.responseTime.improving ? '↓' : '↑'} ${report.trends.responseTime.change}%\n`;
    text += `错误率: ${report.trends.errorRate.improving ? '↓' : '↑'} ${report.trends.errorRate.change}%\n`;
    text += `缓存命中率: ${report.trends.cacheHitRate.improving ? '↑' : '↓'} ${report.trends.cacheHitRate.change}%\n\n`;

    text += '--- 告警统计 ---\n';
    text += `总告警数: ${report.alerts.total}\n`;
    text += `严重: ${report.alerts.critical}\n`;
    text += `错误: ${report.alerts.error}\n`;
    text += `警告: ${report.alerts.warning}\n\n`;

    text += '--- 优化建议 ---\n';
    report.recommendations.forEach((rec, index) => {
      text += `${index + 1}. ${rec}\n`;
    });

    return text;
  }

  /**
   * 启动定时报告
   */
  scheduleReports(): void {
    // 每小时报告
    this.scheduleReport(ReportType.HOURLY, 60 * 60 * 1000);
    
    // 每日报告（每天凌晨1点）
    this.scheduleReport(ReportType.DAILY, 24 * 60 * 60 * 1000);
    
    logger.info('定时性能报告已启动');
  }

  /**
   * 调度报告
   */
  private scheduleReport(type: ReportType, intervalMs: number): void {
    // 清除现有任务
    const existingTask = this.scheduledTasks.get(type);
    if (existingTask) {
      clearInterval(existingTask);
    }

    // 创建新任务
    const task = setInterval(async () => {
      try {
        const report = await this.generateReport(type);
        const text = this.formatReportAsText(report);
        logger.info(`\n${text}`);
      } catch (error) {
        logger.error(`生成 ${type} 报告失败:`, error);
      }
    }, intervalMs);

    this.scheduledTasks.set(type, task);
  }

  /**
   * 停止定时报告
   */
  stopScheduledReports(): void {
    this.scheduledTasks.forEach(task => clearInterval(task));
    this.scheduledTasks.clear();
    logger.info('定时性能报告已停止');
  }

  /**
   * 获取报告历史
   */
  getReportHistory(type?: ReportType): PerformanceReport[] {
    if (type) {
      return this.reports.filter(r => r.type === type);
    }
    return this.reports;
  }

  /**
   * 获取最新报告
   */
  getLatestReport(type: ReportType): PerformanceReport | undefined {
    const reports = this.reports.filter(r => r.type === type);
    return reports[reports.length - 1];
  }
}
