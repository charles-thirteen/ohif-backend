import jwt from 'jsonwebtoken';
import type { ITokenPayload, IAuthTokens } from '@Interface/user';
import { AppError } from '@Class/error';

export class TokenService {
	private accessTokenSecret: string;
	private refreshTokenSecret: string;
	private accessTokenExpiration: string;
	private refreshTokenExpiration: string;

	constructor() {
		this.accessTokenSecret = process.env.JWT_SECRET!;
		this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
		this.accessTokenExpiration = process.env.JWT_ACCESS_EXPIRATION || '15m';
		this.refreshTokenExpiration = process.env.JWT_REFRESH_EXPIRATION || '7d';

		if (!this.accessTokenSecret || !this.refreshTokenSecret) {
			throw new Error('JWT secrets must be defined in environment variables');
		}
	}

	generateAccessToken(userId: string, email: string): string {
		const payload: ITokenPayload = {
			userId,
			email,
			type: 'access',
		};

		return jwt.sign(payload, this.accessTokenSecret, {
			expiresIn: this.accessTokenExpiration as any,
		});
	}

	generateRefreshToken(userId: string, email: string): string {
		const payload: ITokenPayload = {
			userId,
			email,
			type: 'refresh',
		};

		return jwt.sign(payload, this.refreshTokenSecret, {
			expiresIn: this.refreshTokenExpiration as any,
		});
	}

	generateTokenPair(userId: string, email: string): IAuthTokens {
		return {
			accessToken: this.generateAccessToken(userId, email),
			refreshToken: this.generateRefreshToken(userId, email),
		};
	}

	verifyAccessToken(token: string): ITokenPayload {
		try {
			const payload = jwt.verify(
				token,
				this.accessTokenSecret,
			) as ITokenPayload;

			if (payload.type !== 'access') {
				throw AppError.unauthorized('Invalid token type');
			}

			return payload;
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				throw AppError.unauthorized('Token expired');
			}
			if (error instanceof jwt.JsonWebTokenError) {
				throw AppError.unauthorized('Invalid token');
			}
			throw error;
		}
	}

	verifyRefreshToken(token: string): ITokenPayload {
		try {
			const payload = jwt.verify(
				token,
				this.refreshTokenSecret,
			) as ITokenPayload;

			if (payload.type !== 'refresh') {
				throw AppError.unauthorized('Invalid token type');
			}

			return payload;
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				throw AppError.unauthorized('Refresh token expired');
			}
			if (error instanceof jwt.JsonWebTokenError) {
				throw AppError.unauthorized('Invalid refresh token');
			}
			throw error;
		}
	}

	getRefreshTokenExpiration(): Date {
		const expiresIn = this.parseExpiration(this.refreshTokenExpiration);
		return new Date(Date.now() + expiresIn);
	}

	private parseExpiration(expiration: string): number {
		const match = expiration.match(/^(\d+)([smhd])$/);
		if (!match) throw new Error('Invalid expiration format');

		const value = parseInt(match[1] as string);
		const unit = match[2] as string;

		const multipliers: Record<string, number> = {
			s: 1000,
			m: 60 * 1000,
			h: 60 * 60 * 1000,
			d: 24 * 60 * 60 * 1000,
		};

		if (!multipliers[unit])
			throw new Error(`Invalid multiplier of ${multipliers[unit]}`);

		return value * multipliers[unit];
	}
}
