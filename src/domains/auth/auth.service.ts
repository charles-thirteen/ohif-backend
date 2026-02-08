import bcrypt from 'bcrypt';
import { AppError } from '@Class/error';
import logger from '@Util/logger';
import type { IAuthRepository } from './auth.interface';
import type { TokenService } from '@Service/token';
import type {
	IAuthTokens,
	ILoginDTO,
	IRegisterDTO,
	IUser,
	IUserResponse,
} from '@Domain/user/user.interface';

export class AuthService {
	private bcryptRounds: number;

	constructor(
		private authRepository: IAuthRepository,
		private tokenService: TokenService,
	) {
		this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
	}

	async register(
		data: IRegisterDTO,
		ip?: string,
	): Promise<{ user: IUserResponse; tokens: IAuthTokens }> {
		logger.info({ email: data.email }, 'User registration attempt');

		// Check if user exists
		const existingUser = await this.authRepository.findUserByEmail(data.email);
		if (existingUser) {
			throw AppError.conflict('User with this email already exists');
		}

		// Validate password strength
		this.validatePassword(data.password);

		// Hash password
		const passwordHash = await bcrypt.hash(data.password, this.bcryptRounds);

		// Create user
		const user = await this.authRepository.createUser(
			data.email,
			passwordHash,
			data.firstName,
			data.lastName,
		);

		logger.info(
			{
				userId: user.id,
				email: user.email,
			},
			'User registered successfully',
		);

		// Generate tokens
		const tokens = this.tokenService.generateTokenPair(user.id, user.email);

		// Store refresh token
		await this.authRepository.createRefreshToken(
			user.id,
			tokens.refreshToken,
			this.tokenService.getRefreshTokenExpiration(),
			ip,
		);

		return {
			user: this.sanitizeUser(user),
			tokens,
		};
	}

	async login(
		data: ILoginDTO,
		ip?: string,
	): Promise<{ user: IUserResponse; tokens: IAuthTokens }> {
		logger.info({ email: data.email }, 'User login attempt');

		// Find user
		const user = await this.authRepository.findUserByEmail(data.email);
		if (!user) {
			throw AppError.unauthorized('Invalid credentials');
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(data.password, user.password);
		if (!isPasswordValid) {
			throw AppError.unauthorized('Invalid credentials');
		}

		// Update last login
		await this.authRepository.updateLastLogin(user.id);

		logger.info(
			{
				userId: user.id,
				email: user.email,
			},
			'User logged in successfully',
		);

		// Generate tokens
		const tokens = this.tokenService.generateTokenPair(user.id, user.email);

		// Store refresh token
		await this.authRepository.createRefreshToken(
			user.id,
			tokens.refreshToken,
			this.tokenService.getRefreshTokenExpiration(),
			ip,
		);

		return {
			user: this.sanitizeUser(user),
			tokens,
		};
	}

	async refreshToken(refreshToken: string, ip?: string): Promise<IAuthTokens> {
		// Verify token format
		const payload = this.tokenService.verifyRefreshToken(refreshToken);

		// Check if token exists in database
		const storedToken =
			await this.authRepository.findRefreshToken(refreshToken);
		if (!storedToken) {
			throw AppError.unauthorized('Invalid refresh token');
		}

		// Check if token is active
		if (!storedToken.isActive) {
			// Token has been revoked - potential token reuse attack
			logger.warn(
				{
					userId: storedToken.userId,
					tokenId: storedToken.id,
				},
				'Attempted reuse of revoked refresh token',
			);

			// Revoke all tokens for this user as a security measure
			await this.authRepository.revokeAllUserTokens(storedToken.userId);

			throw AppError.unauthorized('Invalid refresh token');
		}

		// Get user
		const user = await this.authRepository.findUserById(payload.userId);
		if (!user) {
			throw AppError.unauthorized('Invalid user');
		}

		// Generate new token pair
		const newTokens = this.tokenService.generateTokenPair(user.id, user.email);

		// Revoke old refresh token
		await this.authRepository.revokeRefreshToken(refreshToken, ip);

		// Store new refresh token
		await this.authRepository.createRefreshToken(
			user.id,
			newTokens.refreshToken,
			this.tokenService.getRefreshTokenExpiration(),
			ip,
		);

		logger.info({ userId: user.id }, 'Tokens refreshed successfully');

		return newTokens;
	}

	async logout(refreshToken: string, ip?: string): Promise<void> {
		await this.authRepository.revokeRefreshToken(refreshToken, ip);
		logger.info('User logged out successfully');
	}

	async logoutAll(userId: string): Promise<void> {
		await this.authRepository.revokeAllUserTokens(userId);
		logger.info({ userId }, 'All user sessions terminated');
	}

	async getProfile(userId: string): Promise<IUserResponse> {
		const user = await this.authRepository.findUserById(userId);
		if (!user) {
			throw AppError.notFound('User not found');
		}
		return this.sanitizeUser(user);
	}

	private sanitizeUser(user: IUser): IUserResponse {
		return {
			id: user.id,
			email: user.email,
			state: user.state,
			firstName: user.firstName,
			lastName: user.lastName,
			createdAt: user.createdAt,
		} as IUser;
	}

	private validatePassword(password: string): void {
		if (password.length < 8) {
			throw AppError.badRequest('Password must be at least 8 characters long');
		}

		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumber = /[0-9]/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
			throw AppError.badRequest(
				'Password must contain uppercase, lowercase, number, and special character',
			);
		}
	}
}
