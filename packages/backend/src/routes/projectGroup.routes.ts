import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Pool } from 'pg';
import { ProjectGroupService } from '../services/ProjectGroupService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

export function createProjectGroupRouter(pool: Pool): Router {
  const router = Router();
  const projectGroupService = new ProjectGroupService(pool);

  /**
   * Get all project groups
   * GET /api/project-groups
   */
  router.get(
    '/',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const projectGroups = await projectGroupService.getAllProjectGroups();
      res.json(projectGroups);
    })
  );

  /**
   * Get project group by ID
   * GET /api/project-groups/:id
   */
  router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const projectGroup = await projectGroupService.getProjectGroupById(id);

      if (!projectGroup) {
        throw new AppError('PROJECT_GROUP_NOT_FOUND', 'Project group not found', 404);
      }

      res.json(projectGroup);
    })
  );

  /**
   * Get project group with tasks
   * GET /api/project-groups/:id/details
   */
  router.get(
    '/:id/details',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const projectGroup = await projectGroupService.getProjectGroupWithTasks(id);

      if (!projectGroup) {
        throw new AppError('PROJECT_GROUP_NOT_FOUND', 'Project group not found', 404);
      }

      res.json(projectGroup);
    })
  );

  /**
   * Get project group statistics
   * GET /api/project-groups/:id/stats
   */
  router.get(
    '/:id/stats',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const stats = await projectGroupService.getProjectGroupStats(id);

      if (!stats) {
        throw new AppError('PROJECT_GROUP_NOT_FOUND', 'Project group not found', 404);
      }

      res.json(stats);
    })
  );

  /**
   * Get tasks by project group
   * GET /api/project-groups/:id/tasks
   */
  router.get(
    '/:id/tasks',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const tasks = await projectGroupService.getTasksByProjectGroup(id);
      res.json(tasks);
    })
  );

  /**
   * Create project group
   * POST /api/project-groups
   */
  router.post(
    '/',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { name, description } = req.body;

      if (!name || name.trim().length === 0) {
        throw new AppError('INVALID_INPUT', 'Project group name is required', 400);
      }

      const projectGroup = await projectGroupService.createProjectGroup({
        name: name.trim(),
        description: description?.trim(),
      });

      res.status(201).json(projectGroup);
    })
  );

  /**
   * Update project group
   * PUT /api/project-groups/:id
   */
  router.put(
    '/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { name, description } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim();

      const projectGroup = await projectGroupService.updateProjectGroup(id, updateData);
      res.json(projectGroup);
    })
  );

  /**
   * Delete project group
   * DELETE /api/project-groups/:id
   */
  router.delete(
    '/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      await projectGroupService.deleteProjectGroup(id);
      res.status(204).send();
    })
  );

  return router;
}