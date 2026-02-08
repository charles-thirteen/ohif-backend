import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from './auth.service';

export class AuthController {
	constructor(private authService: AuthService) {}

	register = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, password, firstName, lastName } = req.body;
			const ip = req.ip;

			const result = await this.authService.register(
				{ email, password, firstName, lastName },
				ip,
			);

			// Set refresh token as httpOnly cookie
			res.cookie('refreshToken', result.tokens.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			res.status(201).json({
				user: result.user,
				accessToken: result.tokens.accessToken,
			});
		} catch (error) {
			next(error);
		}
	};

	login = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, password } = req.body;
			const ip = req.ip;

			const result = await this.authService.login({ email, password }, ip);

			res.cookie('refreshToken', result.tokens.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 7 * 24 * 60 * 60 * 1000,
			});

			res.json({
				user: result.user,
				accessToken: result.tokens.accessToken,
			});
		} catch (error) {
			next(error);
		}
	};

	refresh = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const refreshToken = req.cookies.refreshToken;

			if (!refreshToken) {
				return res.status(401).json({
					message: 'No refresh token provided',
				});
			}

			const ip = req.ip;
			const tokens = await this.authService.refreshToken(refreshToken, ip);

			res.cookie('refreshToken', tokens.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 7 * 24 * 60 * 60 * 1000,
			});

			res.json({
				accessToken: tokens.accessToken,
			});
		} catch (error) {
			next(error);
		}
	};

	logout = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const refreshToken = req.cookies.refreshToken;

			if (refreshToken) {
				const ip = req.ip;
				await this.authService.logout(refreshToken, ip);
			}

			res.clearCookie('refreshToken');

			res.json({
				message: 'Logged out successfully',
			});
		} catch (error) {
			next(error);
		}
	};

	logoutAll = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user!.id;

			await this.authService.logoutAll(userId);
			res.clearCookie('refreshToken');

			res.json({
				message: 'All sessions terminated',
			});
		} catch (error) {
			next(error);
		}
	};

	getProfile = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user!.id;
			const user = await this.authService.getProfile(userId);

			res.json({
				...user,
			});
		} catch (error) {
			next(error);
		}
	};
}
