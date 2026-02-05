import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import errorHandler from '@Middleware/errorHandler';
import logger from '@Util/logger';
import { AppError } from '@Class/error';
import { Container } from './container';
import { createAuthRoutes } from '@Route/auth';

const app = express();
const port = process.env.PORT;

// Dependency injection
const container = Container.getInstance();

// Helmet
app.use(helmet());

// Cors
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
		credentials: true,
		optionsSuccessStatus: 200,
	}),
);

// Body parser - Parse JSON bodies (built into Express 4.16+)
app.use(express.json({ limit: '10mb' }));

// Body parser - Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser - Parse cookies
app.use(cookieParser());

// Compression - Compress responses
app.use(compression());

// Global error handler
app.use(errorHandler(logger));

process.on('uncaughtException', (error) => {
	const isTrustedError = error instanceof AppError;

	if (!isTrustedError) process.exit(1);
});

app.use(
	'/api/auth',
	createAuthRoutes(container.authController, container.authMiddleware),
);

app.listen((error) => {
	if (error) return console.log('Error: ', error);

	console.log(`Server is running at port ${port}`);
});
