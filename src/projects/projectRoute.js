import express from 'express';
import { createProject, createProjectTask, deleteProject, getProjectList, getProjectStats, getProjectTask, getProjectTasks,  updateProjectInfo } from './projectController.js';
import { validateUUID } from '../middleware/validateUUID.js';
import { requireProjectOwner } from '../middleware/ownershipMiddleware.js';
const router = express.Router();

router.get("/", getProjectList);
router.post("/", createProject);
router.get("/:id", validateUUID('id'), getProjectTask);
router.patch("/:id", validateUUID('id'), requireProjectOwner, updateProjectInfo);
router.delete("/:id", validateUUID('id'), requireProjectOwner, deleteProject);
router.get("/:id/tasks", validateUUID('id'), getProjectTasks);
router.post("/:id/tasks", validateUUID('id'), createProjectTask);
router.get('/:id/stats', validateUUID('id'), requireProjectOwner, getProjectStats); 

export default router;
