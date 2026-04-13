import createHttpError from 'http-errors';
import { asyncHandler } from "../utils/advanceFunctions.js";
import { returnResponse } from "../utils/returnResponse.js";
import { db } from '../config/db.js';
import {
    listProjects,
    getProject,
    createProject as createProjectService,
    updateProject,
    deleteProject as deleteProjectService,
    getProjectStats as getProjectStatsService,
} from './projectService.js';
import {
    createProjectSchema,
    updateProjectSchema,
    PROJECT_ALLOWED_UPDATE_FIELDS,
} from '../validationSchemas/projectSchema.js';
import { listTasks, createTask } from '../tasks/taskService.js';
import { createTaskSchema, taskFilterSchema } from '../validationSchemas/taskSchema.js';
import { paginationSchema } from '../validationSchemas/paginationSchema.js';

const dependencies = { db };

export const getProjectList = asyncHandler(async (req, res, next) => {
    const pagination = paginationSchema.parse(req.query); // coerces strings to numbers
    const result = await listProjects(req.user.user_id, pagination, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    returnResponse("Projects fetched successfully", res, 200, result.data);
});

export const getProjectTask = asyncHandler(async (req, res, next) => {
    const result = await getProject(req.params.id, req.user.user_id, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    returnResponse("Project fetched successfully", res, 200, result.data);
});

export const getProjectStats = asyncHandler(async (req, res, next) => {
    const result = await getProjectStatsService(req.params.id, req.user.user_id, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    returnResponse("Project stats fetched successfully", res, 200, result.data);
});

export const getProjectTasks = asyncHandler(async (req, res, next) => {
    const filterParsed = taskFilterSchema.safeParse(req.query);
    if (!filterParsed.success) {
        const fields = Object.fromEntries(
            filterParsed.error.errors.map((e) => [e.path.join('.'), e.message])
        );
        return res.status(400).json({ error: 'validation failed', fields });
    }

    const pagination = paginationSchema.parse(req.query);
    const result = await listTasks(req.params.id, filterParsed.data, pagination, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    returnResponse("Tasks fetched successfully", res, 200, result.data);
});


export const createProject = asyncHandler(async (req, res, next) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
        const fields = Object.fromEntries(
            (parsed.error?.issues || []).map((e) => [
                e.path.length > 0 ? e.path.join('.') : e.code,
                e.message
            ])
        );
        return res.status(400).json({ error: 'validation failed', fields });
    }
    const result = await createProjectService(parsed.data, req.user.user_id, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    returnResponse("Project created successfully", res, 201, result.data);
});

export const updateProjectInfo = asyncHandler(async (req, res, next) => {
    const bodyData = req.body || {};
    const filtered = Object.fromEntries(
        Object.entries(bodyData).filter(([key]) => PROJECT_ALLOWED_UPDATE_FIELDS.includes(key))
    );

    if (Object.keys(filtered).length === 0) {
        return res.status(400).json({
            error: 'validation failed',
            fields: { body: 'at least one field must be provided' }
        });
    }
    const parsed = updateProjectSchema.safeParse(filtered);
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

    const result = await updateProject(req.project.id, parsed.data, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    returnResponse("Project updated successfully", res, 200, result.data);
});

export const deleteProject = asyncHandler(async (req, res, next) => {
    // req.project attached by requireProjectOwner middleware
    const result = await deleteProjectService(req.project.id, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    res.status(204).send();
});

export const createProjectTask = asyncHandler(async (req, res, next) => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        const fields = Object.fromEntries(
            (parsed.error?.issues || []).map((e) => [
                e.path.length > 0 ? e.path.join('.') : e.code,
                e.message
            ])
        );
        return res.status(400).json({ error: 'validation failed', fields });
    }

    const result = await createTask(req.params.id, parsed.data, req.user.user_id, dependencies);
    if (!result.success) return next(createHttpError(result.status, result.message));
    returnResponse("Task created successfully", res, 201, result.data);
});
