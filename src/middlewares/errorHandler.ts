import { AppError } from '@Class/error';
import shapedResponse from '@Util/error/shapedResponse';
import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';

export default function errorHandler(logger: Logger) {
	return (
		error: Error | AppError,
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		if (error instanceof AppError) {
			logger.warn(
				{
					code: error.code,
					message: error.message,
					path: req.path,
				},
				'Operational error',
			);

			return shapedResponse(res, error);
		}

		logger.error(
			{
				message: error.message,
				stack: error.stack,
				path: req.path,
			},
			'Unexpected error',
		);

		shapedResponse(res, new AppError(500, error.message, false));

		next();
	};
}
