import { AuthController } from '@Domain/auth/auth.controller';
import { AuthRepository } from '@Domain/auth/auth.repository';
import { AuthService } from '@Domain/auth/auth.service';
import { AuthMiddleware } from '@Middleware/auth';
import { TokenService } from '@Service/token';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export class Container {
	private static instance: Container;

	public prisma: PrismaClient;
	public authController: AuthController;
	public authMiddleware: AuthMiddleware;

	private constructor() {
		// Database connection
		// @ts-ignore
		const connectionString = process.env.DATABASE_URL!;
		const adapter = new PrismaPg({ connectionString });
		this.prisma = new PrismaClient({
			adapter,
			log: ['info', 'error', 'query', 'warn'],
		});

		// Repositories
		const authRepository = new AuthRepository(this.prisma);

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
