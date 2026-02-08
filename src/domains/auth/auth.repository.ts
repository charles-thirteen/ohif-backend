import type { PrismaClient } from 'src/generated/prisma/client';
import type { IAuthRepository } from './auth.interface';
import type { IRefreshToken, IUser } from '@Domain/user/user.interface';

export class AuthRepository implements IAuthRepository {
	constructor(private prisma: PrismaClient) {}

	// Mappers - convert Prisma models to your interface types
	private mapToUser(user: any): IUser {
		return {
			id: user.id,
			email: user.email,
			password: user.password,
			firstName: user.firstName,
			lastName: user.lastName,
			isVerified: user.isVerified ?? false,
			lastLoginAt: user.lastLoginAt,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			state: user.state ?? {},
		} as IUser;
	}

	private mapToRefreshToken(token: any): IRefreshToken {
		return {
			id: token.id,
			userId: token.userId,
			token: token.token,
			expiresAt: token.expiresAt,
			createdAt: token.createdAt,
			createdByIp: token.createdByIp,
			revokedAt: token.revokedAt,
			revokedByIp: token.revokedByIp,
			replacedByToken: token.replacedByToken,
		} as IRefreshToken;
	}

	async findUserById(id: string): Promise<IUser | null> {
		const user = await this.prisma.user.findUnique({
			where: { id },
		});
		return user ? this.mapToUser(user) : null;
	}

	async findUserByEmail(email: string): Promise<IUser | null> {
		const user = await this.prisma.user.findUnique({
			where: { email },
		});
		return user ? this.mapToUser(user) : null;
	}

	async updateLastLogin(userId: string): Promise<void> {
		await this.prisma.user.update({
			where: { id: userId },
			data: { lastLoginAt: new Date() },
		});
	}

	async createRefreshToken(
		userId: string,
		token: string,
		expiresAt: Date,
		ip: string | null = null,
	): Promise<IRefreshToken> {
		const refreshToken = await this.prisma.refreshToken.create({
			data: {
				userId,
				token,
				expiresAt,
				createdByIp: ip,
			},
		});
		return this.mapToRefreshToken(refreshToken);
	}

	async findRefreshToken(token: string): Promise<IRefreshToken | null> {
		const refreshToken = await this.prisma.refreshToken.findUnique({
			where: { token },
		});
		return refreshToken ? this.mapToRefreshToken(refreshToken) : null;
	}

	async revokeRefreshToken(
		token: string,
		ip: string | null = null,
	): Promise<void> {
		await this.prisma.refreshToken.update({
			where: { token },
			data: {
				revokedAt: new Date(),
				revokedByIp: ip,
			},
		});
	}

	async revokeAllUserTokens(userId: string): Promise<void> {
		await this.prisma.refreshToken.updateMany({
			where: {
				userId,
				revokedAt: null,
			},
			data: {
				revokedAt: new Date(),
			},
		});
	}

	async deleteExpiredTokens(): Promise<void> {
		await this.prisma.refreshToken.deleteMany({
			where: {
				expiresAt: {
					lt: new Date(), // less than current date
				},
			},
		});
	}

	async createUser(
		email: string,
		password: string,
		firstName?: string,
		lastName?: string,
	): Promise<IUser> {
		const user = await this.prisma.user.create({
			data: {
				email,
				password,
				firstName: firstName || '',
				lastName: lastName || '',
				state: {},
			},
		});
		return this.mapToUser(user);
	}
}
