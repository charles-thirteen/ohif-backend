import type { ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const validate =
	(schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.body);

		if (!result.success) {
			const errors = result.error.issues.map((issue) => ({
				field: issue.path.join('.'),
				message: issue.message,
			}));

			return res.status(400).json({
				success: false,
				message: 'Validation error',
				errors,
			});
		}

		// Replace body with validated + stripped data
		req.body = result.data;

		next();
	};
