import type { Request, Response } from 'express';
import { Router } from 'express';
import { DependencyService } from '../services/DependencyService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const dependencyService = new DependencyService();

/**
 * Add a dependency between tasks
 * POST /api/dependencies
 * Body: { taskId: string, dependsOnTaskId: string }
 */
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId, dependsOnTaskId } = req.body;

  if (!taskId || !dependsOnTaskId) {
    return res.status(400).json({
      error: 'taskId and dependsOnTaskId are required',
    });
  }

  const dependency = await dependencyService.addDependency({
    taskId,
    dependsOnTaskId,
  });

  res.status(201).json(dependency);
}));

router.delete('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId, dependsOnTaskId } = req.body;

  if (!taskId || !dependsOnTaskId) {
    return res.status(400).json({
      error: 'taskId and dependsOnTaskId are required',
    });
  }

  await dependencyService.removeDependency(taskId, dependsOnTaskId);

  res.status(204).send();
}));

router.get('/:taskId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const dependencies = await dependencyService.getTaskDependencies(taskId);

  res.json(dependencies);
}));

router.get('/:taskId/dependents', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const dependents = await dependencyService.getDependentTasks(taskId);

  res.json(dependents);
}));

router.get('/:taskId/resolved', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const resolved = await dependencyService.areDependenciesResolved(taskId);

  res.json({ resolved });
}));

router.get('/:taskId/unresolved', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const unresolved = await dependencyService.getUnresolvedDependencies(taskId);

  res.json({ unresolvedDependencies: unresolved });
}));

router.post('/check-circular', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId, dependsOnTaskId } = req.body;

  if (!taskId || !dependsOnTaskId) {
    return res.status(400).json({
      error: 'taskId and dependsOnTaskId are required',
    });
  }

  const wouldCreate = await dependencyService.wouldCreateCircularDependency(taskId, dependsOnTaskId);

  res.json({ wouldCreateCircularDependency: wouldCreate });
}));

export default router;
