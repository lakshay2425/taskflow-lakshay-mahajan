import { z } from 'zod';

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().trim().max(1000, 'Description too long').optional(),
  status: z.enum(VALID_STATUSES).optional().default('todo'),
  priority: z.enum(VALID_PRIORITIES).optional().default('medium'),
  assignee_id: z.string().uuid('assignee_id must be a valid UUID').nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be YYYY-MM-DD').nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(VALID_STATUSES).optional(),
  priority: z.enum(VALID_PRIORITIES).optional(),
  assignee_id: z.string().uuid('assignee_id must be a valid UUID').nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be YYYY-MM-DD').nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

export const TASK_ALLOWED_UPDATE_FIELDS = [
  'title', 'description', 'status', 'priority', 'assignee_id', 'due_date'
];

export const taskFilterSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  assignee: z.string().uuid('assignee must be a valid UUID').optional(),
});
