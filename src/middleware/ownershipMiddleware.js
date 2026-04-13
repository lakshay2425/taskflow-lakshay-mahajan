import createHttpError from 'http-errors';
import { db } from '../config/db.js';
import { asyncHandler } from '../utils/advanceFunctions.js';

export const requireProjectOwner = asyncHandler(async (req, res, next) => {
  const project = await db('projects')
    .where({ id: req.params.id })
    .first();

  if (!project) return next(createHttpError(404, 'Project not found'));
  if (project.owner_id !== req.user.user_id) {
    return next(createHttpError(403, 'You do not have permission to modify this project'));
  }

  req.project = project;
  next();
});

export const requireTaskAccess = asyncHandler(async (req, res, next) => {
  const task = await db('tasks')
    .join('projects', 'projects.id', 'tasks.project_id')
    .where('tasks.id', req.params.id)
    .select('tasks.*', 'projects.owner_id as project_owner_id')
    .first();

  if (!task) return next(createHttpError(404, 'Task not found'));

  const isProjectOwner = task.project_owner_id === req.user.user_id;
  const isCreator = task.created_by === req.user.user_id;   // ← spec: owner or creator

  if (!isProjectOwner && !isCreator) {
    return next(createHttpError(403, 'You do not have permission to modify this task'));
  }

  req.task = task;
  next();
});
