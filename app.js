import express from 'express';
import cors from 'cors';
import {config} from './src/config/config.js';
import indexRouter from "./src/indexRoutes.js"
import { v4 as uuidv4 } from 'uuid';
import { globalErrorHandler } from './src/middleware/globalErrorHandler.js';
const app = express();

const allowedOrigins =  [config.get("FRONTEND_URL")];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'withCredentials', 'X-Requested-With','Accept'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((_req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});
// Request ID middleware - adds unique ID to each request
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.set('X-Request-ID', req.requestId);
  next();
});


app.get("/health", (req,res)=> {
  res.status(200).json({
    message: "Running",
  });
})
app.use("/api", indexRouter);
app.use(globalErrorHandler);

export default app;
