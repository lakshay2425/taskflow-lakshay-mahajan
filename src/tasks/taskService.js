import { dbOperation } from "../utils/advanceFunctions.js"

export const listTasks = async (projectId, filters, pagination, dependencies) => {
    const { db } = dependencies;

    const project = await dbOperation(
        () => db('projects').where({ id: projectId }).first(),
        'Failed to fetch project'
    );

    if (!project) return { success: false, status: 404, message: 'Project not found' };

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const query = db('tasks').where({ project_id: projectId });
    if (filters.status) query.where({ status: filters.status });
    if (filters.assignee) query.where({ assignee_id: filters.assignee });

    const [{ count }] = await dbOperation(
        () => query.clone().count('* as count'),
        'Failed to count tasks'
    );

    const tasks = await dbOperation(
        () => query.orderBy('created_at', 'asc').limit(limit).offset(offset),
        'Failed to fetch tasks'
    );

    return {
        success: true,
        status: 200,
        data: {
            tasks,
            pagination: {
                total: Number(count),
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(Number(count) / limit),
            },
        },
    };
};

export const createTask = async (projectId, inputData, userId, dependencies) => {
    const { db } = dependencies;

    const project = await dbOperation(
        () => db('projects').where({ id: projectId }).first(),
        'Failed to fetch project'
    );
    if (!project) return { success: false, status: 404, message: 'Project not found' };
    console.log('project:', project);
    console.log('userId:', userId);
    console.log('inputData:', inputData);
    const task = await dbOperation(
        () => db('tasks')
            .insert({
                title: inputData.title,
                description: inputData.description ?? null,
                status: inputData.status ?? 'todo',
                priority: inputData.priority ?? 'medium',
                project_id: projectId,
                assignee_id: inputData.assignee_id ?? null,
                due_date: inputData.due_date ?? null,
                created_by: userId,
            })
            .returning('*')
            .then(([row]) => row),
        'Failed to create task'
    );

    return { success: true, status: 201, data: task };
};

export const updateTask = async (taskId, updates, dependencies) => {
    const { db } = dependencies;
    const result = await dbOperation(
        () => db.transaction(async (trx) => {
            await trx.raw(`SET LOCAL lock_timeout = '5000ms'`);
            const [task] = await trx('tasks')
                .where({ id: taskId })
                .forUpdate()
                .update({ ...updates, updated_at: trx.fn.now() })
                .returning('*');
            return task;
        }), "Failed to update the task"
    );
    return { success: true, status: 200, data: result };

};

export const deleteTask = async (taskId, dependencies) => {
    const { db } = dependencies;
    await dbOperation(
        () => db.transaction(async (trx) => {
            await trx.raw(`SET LOCAL lock_timeout = '5000ms'`);
            await trx('tasks').where({ id: taskId }).forUpdate();
            await trx('tasks').where({ id: taskId }).delete();
        }), "Failed to delete the task")
    return { success: true, status: 204 };
};
