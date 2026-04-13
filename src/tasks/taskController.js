import createHttpError from 'http-errors';
import { asyncHandler } from "../utils/advanceFunctions.js";
import { returnResponse } from "../utils/returnResponse.js";
import { db } from '../config/db.js';
import { updateTask as updateTaskService, deleteTask as deleteTaskService } from './taskService.js';
import { updateTaskSchema, TASK_ALLOWED_UPDATE_FIELDS } from '../validationSchemas/taskSchema.js';

const dependencies = { db };

export const updateTask = asyncHandler(async (req, res, next) => {
    const bodyData = req.body || {};
    const filtered = Object.fromEntries(
        Object.entries(bodyData).filter(([key]) => TASK_ALLOWED_UPDATE_FIELDS.includes(key))
    );

    if (Object.keys(filtered).length === 0) {
        return res.status(400).json({
            error: 'validation failed',
            fields: { body: 'at least one field must be provided' }
        });
    }

    const parsed = updateTaskSchema.safeParse(filtered);
    if (!parsed.success) {
        const fields = Object.fromEntries(
            (parsed.error?.issues || [])
                .filter((e) => e.path.length > 0)
                .map((e) => [e.path.join('.'), e.message])
        );

        if (Object.keys(fields).length === 0) {
            return res.status(400).json({
                error: 'validation failed',
                fields: { body: 'invalid input provided' }
            });
        }
        return res.status(400).json({ error: 'validation failed', fields });
    }

    const result = await updateTaskService(req.task.id, parsed.data, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    returnResponse("Task updated successfully", res, 200, result.data);
});

export const deleteTask = asyncHandler(async (req, res, next) => {
    const result = await deleteTaskService(req.task.id, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    res.status(204).send();
});
