import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireDeveloper } from '../middleware/permission.middleware';
import { RealTimeMetricsService } from '../services/RealTimeMetrics';
import { PerformanceAlertService, AlertType } from '../services/PerformanceAlert';
import { PerformanceReportService, ReportType } from '../services/PerformanceReport';
import { logger } from '../config/logger';

const router = Router();

// 所有路由都需要认证和开发者权限
router.use(authenticate);
router.use(requireDeveloper);

/**
 * 获取实时性能指标
 * GET /api/performance/metrics/realtime
 */
router.get('/metrics/realtime', async (req: Request, res: Response) => {
  try {
    const metricsService = (req.app.locals.metricsService as RealTimeMetricsService);
    const metrics = await metricsService.getCurrentMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('获取实时指标失败:', error);
    res.status(500).json({
      success: false,
      message: '获取实时指标失败'
    });
  }
});

/**
 * 获取历史性能指标
 * GET /api/performance/metrics/history?minutes=5
 */
router.get('/metrics/history', async (req: Request, res: Response) => {
  try {
    const minutes = parseInt(req.query.minutes as string) || 5;
    const metricsService = (req.app.locals.metricsService as RealTimeMetricsService);
    const history = metricsService.getHistoricalMetrics(minutes);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('获取历史指标失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史指标失败'
    });
  }
});

/**
 * 获取指标统计
 * GET /api/performance/metrics/stats?minutes=5
 */
router.get('/metrics/stats', async (req: Request, res: Response) => {
  try {
    const minutes = parseInt(req.query.minutes as string) || 5;
    const metricsService = (req.app.locals.metricsService as RealTimeMetricsService);
    const stats = metricsService.getMetricsStats(minutes);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取指标统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取指标统计失败'
    });
  }
});

/**
 * 获取活跃告警
 * GET /api/performance/alerts/active
 */
router.get('/alerts/active', async (req: Request, res: Response) => {
  try {
    const alertService = (req.app.locals.alertService as PerformanceAlertService);
    const alerts = alertService.getActiveAlerts();
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('获取活跃告警失败:', error);
    res.status(500).json({
      success: false,
      message: '获取活跃告警失败'
    });
  }
});

/**
 * 获取告警历史
 * GET /api/performance/alerts/history?minutes=60
 */
router.get('/alerts/history', async (req: Request, res: Response) => {
  try {
    const minutes = parseInt(req.query.minutes as string) || 60;
    const alertService = (req.app.locals.alertService as PerformanceAlertService);
    const history = alertService.getAlertHistory(minutes);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('获取告警历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取告警历史失败'
    });
  }
});

/**
 * 获取告警统计
 * GET /api/performance/alerts/stats?minutes=60
 */
router.get('/alerts/stats', async (req: Request, res: Response) => {
  try {
    const minutes = parseInt(req.query.minutes as string) || 60;
    const alertService = (req.app.locals.alertService as PerformanceAlertService);
    const stats = alertService.getAlertStats(minutes);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取告警统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取告警统计失败'
    });
  }
});

/**
 * 获取告警规则
 * GET /api/performance/alerts/rules
 */
router.get('/alerts/rules', async (req: Request, res: Response) => {
  try {
    const alertService = (req.app.locals.alertService as PerformanceAlertService);
    const rules = alertService.getAllRules();
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('获取告警规则失败:', error);
    res.status(500).json({
      success: false,
      message: '获取告警规则失败'
    });
  }
});

/**
 * 更新告警规则
 * PUT /api/performance/alerts/rules/:type
 */
router.put('/alerts/rules/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as AlertType;
    const updates = req.body;
    
    const alertService = (req.app.locals.alertService as PerformanceAlertService);
    alertService.updateRule(type, updates);
    
    res.json({
      success: true,
      message: '告警规则已更新'
    });
  } catch (error) {
    logger.error('更新告警规则失败:', error);
    res.status(500).json({
      success: false,
      message: '更新告警规则失败'
    });
  }
});

/**
 * 手动解决告警
 * POST /api/performance/alerts/:id/resolve
 */
router.post('/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const alertId = req.params.id;
    
    const alertService = (req.app.locals.alertService as PerformanceAlertService);
    const resolved = alertService.manualResolveAlert(alertId);
    
    if (resolved) {
      res.json({
        success: true,
        message: '告警已解决'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '告警不存在'
      });
    }
  } catch (error) {
    logger.error('解决告警失败:', error);
    res.status(500).json({
      success: false,
      message: '解决告警失败'
    });
  }
});

/**
 * 生成性能报告
 * POST /api/performance/reports/generate
 */
router.post('/reports/generate', async (req: Request, res: Response) => {
  try {
    const type = (req.body.type as ReportType) || ReportType.HOURLY;
    
    const reportService = (req.app.locals.reportService as PerformanceReportService);
    const report = await reportService.generateReport(type);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('生成性能报告失败:', error);
    res.status(500).json({
      success: false,
      message: '生成性能报告失败'
    });
  }
});

/**
 * 获取报告历史
 * GET /api/performance/reports/history?type=hourly
 */
router.get('/reports/history', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as ReportType | undefined;
    
    const reportService = (req.app.locals.reportService as PerformanceReportService);
    const history = reportService.getReportHistory(type);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('获取报告历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取报告历史失败'
    });
  }
});

/**
 * 获取最新报告
 * GET /api/performance/reports/latest?type=hourly
 */
router.get('/reports/latest', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as ReportType) || ReportType.HOURLY;
    
    const reportService = (req.app.locals.reportService as PerformanceReportService);
    const report = reportService.getLatestReport(type);
    
    if (report) {
      res.json({
        success: true,
        data: report
      });
    } else {
      res.status(404).json({
        success: false,
        message: '报告不存在'
      });
    }
  } catch (error) {
    logger.error('获取最新报告失败:', error);
    res.status(500).json({
      success: false,
      message: '获取最新报告失败'
    });
  }
});

export default router;
