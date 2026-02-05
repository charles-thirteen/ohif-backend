import { Pool } from 'pg';
import { AuthController } from '@Controller/auth';
import { AuthMiddleware } from '@Middleware/auth';
import { AuthRepository } from './repositories/auth';
import { TokenService } from '@Service/token';
import { AuthService } from '@Service/auth';

export class Container {
	private static instance: Container;

	public authController: AuthController;
	public authMiddleware: AuthMiddleware;

	private constructor() {
		// Database connection
		const db = new Pool({
			connectionString: process.env.DATABASE_URL,
		});

		// Repositories
		const authRepository = new AuthRepository(db);

		// Services
		const tokenService = new TokenService();
		const authService = new AuthService(authRepository, tokenService);

		// Controllers
		this.authController = new AuthController(authService);

		// Middleware
		this.authMiddleware = new AuthMiddleware(tokenService);
	}

	public static getInstance(): Container {
		if (!Container.instance) {
			Container.instance = new Container();
		}
		return Container.instance;
	}
}
