import express from 'express'
import { validateUUID } from '../middleware/validateUUID.js';
import { requireTaskAccess } from '../middleware/ownershipMiddleware.js';
import { updateTask, deleteTask } from './taskController.js';
const router = express.Router();

router.patch("/:id", validateUUID('id'), requireTaskAccess, updateTask);
router.delete("/:id", validateUUID('id'), requireTaskAccess, deleteTask);

export default router;
