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
import { createStateRoutes } from '@Domain/state/state.route';

const app = express();
const port = process.env.PORT || 3050;

// Dependency injection
const container = Container.getInstance();

// Helmet
app.use(helmet());

// Cors - allow OHIF dev server
app.use(
	cors({
		origin: ['http://localhost:3000'],
		credentials: true,
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

process.on('uncaughtException', (error) => {
	const isTrustedError = error instanceof AppError;

	if (!isTrustedError) {
		logger.error({ error: error.message }, 'Server Error');
		process.exit(1);
	}
});

app.use(
	'/api/state',
	createStateRoutes(container.stateController, container.keycloakMiddleware),
);

// Global error handler - must be after routes
app.use(errorHandler(logger));

app.listen(port, (error) => {
	if (error) return console.log('Error: ', error);

	logger.info(`Server is running at port ${port}`);
});
