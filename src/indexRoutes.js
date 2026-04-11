import express from 'express';
const router = express.Router();
import authRoutes from "./auth/authRoute.js"
import projectRoutes from "./projects/projectRoute.js"
import taskRoutes from "./tasks/taskRoute.js"

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);

export default router;
