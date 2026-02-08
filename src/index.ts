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
import { createAuthRoutes } from '@Domain/auth/auth.route';

const app = express();
const port = process.env.PORT;

// Dependency injection
const container = Container.getInstance();

// Helmet
app.use(helmet());

// Cors
app.use(cors());

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

	if (!isTrustedError) {
		logger.error({ error: error.message }, 'Server Error');
		process.exit(1);
	}
});

app.use(
	'/api/auth',
	createAuthRoutes(container.authController, container.authMiddleware),
);

app.listen(port, (error) => {
	if (error) return console.log('Error: ', error);

	logger.info(`Server is running at port ${port}`);
});
