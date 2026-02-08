import type { IRefreshToken, IUser } from '@Domain/user/user.interface';

export interface IAuthRepository {
	createUser(
		email: string,
		passwordHash: string,
		firstName?: string,
		lastName?: string,
	): Promise<IUser>;
	findUserByEmail(email: string): Promise<IUser | null>;
	findUserById(id: string): Promise<IUser | null>;
	updateLastLogin(userId: string): Promise<void>;

	// Refresh token operations
	createRefreshToken(
		userId: string,
		token: string,
		expiresAt: Date,
		ip?: string,
	): Promise<IRefreshToken>;
	findRefreshToken(token: string): Promise<IRefreshToken | null>;
	revokeRefreshToken(token: string, ip?: string): Promise<void>;
	revokeAllUserTokens(userId: string): Promise<void>;
	deleteExpiredTokens(): Promise<void>;
}
