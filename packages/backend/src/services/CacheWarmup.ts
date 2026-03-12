import { logger } from '../config/logger';
import { CacheService } from './CacheService';
import { SystemConfigService } from './SystemConfigService';
import { PositionService } from './PositionService';
import { UserService } from './UserService';
import { TaskService } from './TaskService';

/**
 * 缓存预热服务
 * 在应用启动时预热常用数据，提升首次访问速度
 */
export class CacheWarmupService {
  private static instance: CacheWarmupService;
  private warmupInProgress = false;
  private lastWarmupTime: Date | null = null;

  private constructor(
    private cacheService: CacheService,
    private systemConfigService: SystemConfigService,
    private positionService: PositionService,
    private userService: UserService,
    private taskService: TaskService
  ) {}

  static getInstance(
    cacheService: CacheService,
    systemConfigService: SystemConfigService,
    positionService: PositionService,
    userService: UserService,
    taskService: TaskService
  ): CacheWarmupService {
    if (!CacheWarmupService.instance) {
      CacheWarmupService.instance = new CacheWarmupService(
        cacheService,
        systemConfigService,
        positionService,
        userService,
        taskService
      );
    }
    return CacheWarmupService.instance;
  }

  /**
   * 执行完整的缓存预热
   */
  async warmupAll(): Promise<void> {
    if (this.warmupInProgress) {
      logger.warn('缓存预热已在进行中，跳过本次请求');
      return;
    }

    this.warmupInProgress = true;
    const startTime = Date.now();

    try {
      logger.info('开始缓存预热...');

      await Promise.all([
        this.warmupSystemConfig(),
        this.warmupPositions(),
        this.warmupActiveUsers(),
        this.warmupHotTasks()
      ]);

      this.lastWarmupTime = new Date();
      const duration = Date.now() - startTime;

      logger.info(`缓存预热完成，耗时: ${duration}ms`);
    } catch (error) {
      logger.error('缓存预热失败:', error);
      throw error;
    } finally {
      this.warmupInProgress = false;
    }
  }

  /**
   * 预热系统配置
   */
  private async warmupSystemConfig(): Promise<void> {
    try {
      logger.debug('预热系统配置...');
      await this.systemConfigService.getConfig();
      logger.debug('系统配置预热完成');
    } catch (error) {
      logger.error('系统配置预热失败:', error);
    }
  }

  /**
   * 预热岗位列表
   */
  private async warmupPositions(): Promise<void> {
    try {
      logger.debug('预热岗位列表...');
      await this.positionService.getAllPositions();
      logger.debug('岗位列表预热完成');
    } catch (error) {
      logger.error('岗位列表预热失败:', error);
    }
  }

  /**
   * 预热活跃用户信息
   * 预热最近活跃的前100个用户
   */
  private async warmupActiveUsers(): Promise<void> {
    try {
      logger.debug('预热活跃用户信息...');
      
      // TODO: 实现获取最近活跃用户的方法
      // 暂时跳过此预热
      logger.debug('活跃用户信息预热跳过（待实现）');
    } catch (error) {
      logger.error('活跃用户信息预热失败:', error);
    }
  }

  /**
   * 预热热门任务
   * 预热最近创建和最活跃的任务
   */
  private async warmupHotTasks(): Promise<void> {
    try {
      logger.debug('预热热门任务...');
      
      // TODO: 实现获取最近任务和进行中任务的方法
      // 暂时跳过此预热
      logger.debug('热门任务预热跳过（待实现）');
    } catch (error) {
      logger.error('热门任务预热失败:', error);
    }
  }

  /**
   * 定时刷新缓存
   * @param intervalMinutes 刷新间隔（分钟）
   */
  startPeriodicWarmup(intervalMinutes: number = 30): void {
    logger.info(`启动定时缓存预热，间隔: ${intervalMinutes} 分钟`);

    setInterval(() => {
      this.warmupAll().catch(error => {
        logger.error('定时缓存预热失败:', error);
      });
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * 获取上次预热时间
   */
  getLastWarmupTime(): Date | null {
    return this.lastWarmupTime;
  }

  /**
   * 检查是否正在预热
   */
  isWarmupInProgress(): boolean {
    return this.warmupInProgress;
  }
}
