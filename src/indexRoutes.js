import express from 'express';
const router = express.Router();
import authRoutes from "./auth/authRoute.js"
import projectRoutes from "./projects/projectRoute.js"
import taskRoutes from "./tasks/taskRoute.js"
import {optionalAuth} from "./middleware/authMiddleware.js"

router.use("/auth", authRoutes);
router.use("/projects", optionalAuth, projectRoutes);
router.use("/tasks", optionalAuth, taskRoutes);

export default router;
