import createHttpError from "http-errors";
import { signupUser, verifyLogin } from "./authService.js";
import db from "../config/db.js";
import bcrypt from "bcrypt";
import { config } from "../config/config.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from "../utilis/advanceFunctions.js";
import { loginSchema, signupSchema } from "../validationSchemas/user.js";
import { ERROR_MESSAGES } from "../validationSchemas/error.js";

const secret = config.get("JWT_SECRET");
const saltRounds = Number(config.get("BCRYPT_SALT_ROUNDS"));
export const userLogin = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const inputValidation = loginSchema.safeParse({ email, password });
    if (!inputValidation.success) {
        return next(createHttpError(400, ERROR_MESSAGES.LOGIN.INVALID_INPUT));
    }


    const loginInfo = await verifyLogin(inputValidation.data, {
        bcrypt, db, jwt, uuidv4, secret, saltRounds
    });

    if (!loginInfo.success) {
        return next(createHttpError(loginInfo.status, loginInfo.message));
    }

    res.status(200).json({
        jwtToken: loginInfo.token,
        message: "User logged in successfully",
    });
});

export const userSignup = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    const inputValidation = signupSchema.safeParse({ name, email, password });
    if (!inputValidation.success) {
        return next(createHttpError(400, ERROR_MESSAGES.SIGNUP.INVALID_INPUT));
    }

    const secret = config.get("JWT_SECRET");
    const signupInfo = await signupUser(inputValidation.data, {
        db, bcrypt, jwt, secret, saltRounds
    });

    if (!signupInfo.success) {
        return next(createHttpError(signupInfo.status, signupInfo.message));
    }

    res.status(201).json({
        jwtToken: signupInfo.token,
        message: "User signed up successfully",
    });
});
