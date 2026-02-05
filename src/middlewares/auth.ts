import type { Request, Response, NextFunction } from 'express';
import type { TokenService } from '@Service/token';
import { AppError } from '@Class/error';
import logger from '@Util/logger';
import { z } from 'zod';

// Extend Express Request type
declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				email: string;
			};
		}
	}
}

export const authValidation = {
	register: z.object({
		email: z.string().email(),
		password: z.string().min(8),
		firstName: z.string().min(1).max(100).optional(),
		lastName: z.string().min(1).max(100).optional(),
	}),

	login: z.object({
		email: z.string().email(),
		password: z.string(),
	}),
};

export class AuthMiddleware {
	constructor(private tokenService: TokenService) {}

	authenticate = (req: Request, res: Response, next: NextFunction) => {
		try {
			// Get token from Authorization header
			const authHeader = req.headers.authorization;

			if (!authHeader || !authHeader.startsWith('Bearer ')) {
				throw AppError.unauthorized('No token provided');
			}

			const token = authHeader.substring(7); // Remove 'Bearer ' prefix

			// Verify token
			const payload = this.tokenService.verifyAccessToken(token);

			// Attach user to request
			req.user = {
				id: payload.userId,
				email: payload.email,
			};

			next();
		} catch (error) {
			if (error instanceof AppError) {
				return next(error);
			}
			logger.error({ error }, 'Authentication error');
			next(AppError.unauthorized('Invalid token'));
		}
	};

	// Optional: middleware for routes that work with or without auth
	optionalAuth = (req: Request, res: Response, next: NextFunction) => {
		try {
			const authHeader = req.headers.authorization;

			if (authHeader && authHeader.startsWith('Bearer ')) {
				const token = authHeader.substring(7);
				const payload = this.tokenService.verifyAccessToken(token);

				req.user = {
					id: payload.userId,
					email: payload.email,
				};
			}

			next();
		} catch (error) {
			// Don't fail, just continue without user
			next();
		}
	};
}
