import { Request, Response, NextFunction } from 'express';

/**
 * 异步路由处理器包装器
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 * 
 * @example
 * router.get('/', asyncHandler(async (req, res) => {
 *   const data = await service.getData();
 *   res.json(data);
 * }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 带类型的异步处理器（用于TypeScript类型推断）
 */
export function createAsyncHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<any>
) {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
