import express from 'express';
import { userLogin, userSignup } from './authController.js';
const router = express.Router();

router.post("/register", userSignup);
router.post("/login", userLogin);

export default router;
