import type { AppError } from '@Class/error';
import type { Response } from 'express';

export default function shapedResponse(
	res: Response,
	error: AppError,
	other: Record<string, any> = {},
) {
	return res.status(error.code).json({
		message: error.message,
		stack: error.stack,
		...other,
	});
}
