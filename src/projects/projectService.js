import { dbOperation } from "../utils/advanceFunctions.js"


export const updateProject = async (projectId, updates, dependencies) => {
    const { db } = dependencies;

    const project = await dbOperation(
        () => db.transaction(async (trx) => {
            await trx.raw(`SET LOCAL lock_timeout = '5000ms'`);
            const [row] = await trx('projects')
                .where({ id: projectId })
                .forUpdate()
                .update(updates)
                .returning('*');
            return row;
        }),
        'Failed to update project'
    );

    return { success: true, status: 200, data: project };
};

export const deleteProject = async (projectId, dependencies) => {
    const { db } = dependencies;

    await dbOperation(
        () => db.transaction(async (trx) => {
            await trx.raw(`SET LOCAL lock_timeout = '5000ms'`);
            await trx('projects').where({ id: projectId }).forUpdate();
            await trx('projects').where({ id: projectId }).delete();
        }),
        'Failed to delete project'
    );

    return { success: true, status: 204, data: null };
};

export const getProject = async (projectId, userId, dependencies) => {
    const { db } = dependencies;

    const project = await dbOperation(
        () => db('projects').where({ id: projectId }).first(),
        'Failed to fetch project'
    );
    if (!project) return { success: false, status: 404, message: 'Project not found' };

    const isMember = project.owner_id === userId;
    if (!isMember) {
        const assignedTask = await dbOperation(
            () => db('tasks').where({ project_id: projectId, assignee_id: userId }).first(),
            'Failed to check task membership'
        );
        if (!assignedTask) return { success: false, status: 403, message: 'Forbidden' };
    }

    const tasks = await dbOperation(
        () => db('tasks').where({ project_id: projectId }).orderBy('created_at', 'asc'),
        'Failed to fetch tasks'
    );

    return { success: true, status: 200, data: { ...project, tasks } };
};

export const getProjectStats = async (projectId, userId, dependencies) => {
    const { db } = dependencies;

    const project = await dbOperation(
        () => db('projects').where({ id: projectId }).first(),
        'Failed to fetch project'
    );
    if (!project) return { success: false, status: 404, message: 'Project not found' };
    if (project.owner_id !== userId) return { success: false, status: 403, message: 'Forbidden' };

    const byStatus = await dbOperation(
        () => db('tasks')
            .where({ project_id: projectId })
            .groupBy('status')
            .select('status')
            .count('* as count'),
        'Failed to fetch status stats'
    );

    const byAssignee = await dbOperation(
        () => db('tasks')
            .where({ project_id: projectId })
            .whereNotNull('assignee_id')
            .groupBy('assignee_id')
            .select('assignee_id')
            .count('* as count'),
        'Failed to fetch assignee stats'
    );

    return {
        success: true,
        status: 200,
        data: { by_status: byStatus, by_assignee: byAssignee }
    };
};

export const createProject = async (inputData, userId, dependencies) => {
    const { db } = dependencies;

    const project = await dbOperation(
        () => db('projects')
            .insert({
                name: inputData.name,
                description: inputData.description ?? null,
                owner_id: userId,
            })
            .returning('*')
            .then(([row]) => row),
        'Failed to create project'
    );

    return { success: true, status: 201, data: project };
};

export const listProjects = async (userId, pagination, dependencies) => {
    const { db } = dependencies;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const baseQuery = db('projects')
        .leftJoin('tasks', 'tasks.project_id', 'projects.id')
        .where('projects.owner_id', userId)
        .orWhere('tasks.assignee_id', userId);

    const [{ count }] = await dbOperation(
        () => baseQuery.clone().countDistinct('projects.id as count'),
        'Failed to count projects'
    );

    const projects = await dbOperation(
        () => baseQuery
            .distinct('projects.id')
            .select('projects.*')
            .orderBy('projects.created_at', 'desc')
            .limit(limit)
            .offset(offset),
        'Failed to fetch projects'
    );

    return {
        success: true,
        status: 200,
        data: {
            projects,
            pagination: {
                total: Number(count),
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(Number(count) / limit),
            },
        },
    };
};
