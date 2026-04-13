import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().trim().max(500, 'Description too long').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(100, 'Name too long').optional(),
  description: z.string().trim().max(500, 'Description too long').nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

export const PROJECT_ALLOWED_UPDATE_FIELDS = ['name', 'description'];
