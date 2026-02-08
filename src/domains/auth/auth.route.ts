import { Router } from 'express';
import type { AuthMiddleware } from '@Middleware/auth';
import { authValidation } from '@Middleware/auth';
import { validate } from '@Middleware/validate';
import type { AuthController } from './auth.controller';

export const createAuthRoutes = (
	authController: AuthController,
	authMiddleware: AuthMiddleware,
): Router => {
	const router = Router();

	// Public routes
	router.post(
		'/register',
		validate(authValidation.register),
		authController.register,
	);
	router.post('/login', validate(authValidation.login), authController.login);
	router.post('/refresh', authController.refresh);
	router.post('/logout', authController.logout);

	// Protected routes
	router.get(
		'/profile',
		authMiddleware.authenticate,
		authController.getProfile,
	);
	router.post(
		'/logout-all',
		authMiddleware.authenticate,
		authController.logoutAll,
	);

	return router;
};
