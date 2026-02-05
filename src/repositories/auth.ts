import type { IAuthRepository } from '@Interface/auth';
import type { IRefreshToken, IUser } from '@Interface/user';
import type { Pool } from 'pg';

export class AuthRepository implements IAuthRepository {
	constructor(private db: Pool) {}

	private mapToUser(row: Record<string, any>): IUser {
		return {
			id: row.id,
			email: row.email,
			password: row.password,
			firstName: row.first_name,
			lastName: row.last_name,
			isVerified: row.is_verified,
			isActive: row.is_active,
			lastLoginAt: row.last_login_at,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		} as IUser;
	}

	private mapToRefreshToken(row: Record<string, any>): IRefreshToken {
		return {
			id: row.id,
			userId: row.user_id,
			token: row.token,
			expiresAt: row.expires_at,
			createdAt: row.created_at,
			createdByIp: row.created_by_ip,
			revokedAt: row.revoked_at,
			revokedByIp: row.revoked_by_ip,
			replacedByToken: row.replaced_by_token,
		} as IRefreshToken;
	}

	async findUserById(id: string): Promise<IUser | null> {
		const result = await this.db.query('SELECT * FROM users WHERE id = $1', [
			id,
		]);
		return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
	}

	async findUserByEmail(email: string): Promise<IUser | null> {
		const result = await this.db.query('SELECT * FROM users WHERE email = $1', [
			email,
		]);
		return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
	}

	async updateLastLogin(userId: string): Promise<void> {
		await this.db.query(
			'UPDATE users SET last_login_at = NOW() WHERE id = $1',
			[userId],
		);
	}

	async createRefreshToken(
		userId: string,
		token: string,
		expiresAt: Date,
		ip?: string,
	): Promise<IRefreshToken> {
		const result = await this.db.query(
			`INSERT INTO refresh_tokens (user_id, token, expires_at, created_by_ip)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
			[userId, token, expiresAt, ip],
		);
		return this.mapToRefreshToken(result.rows[0]);
	}

	async findRefreshToken(token: string): Promise<IRefreshToken | null> {
		const result = await this.db.query(
			'SELECT * FROM refresh_tokens WHERE token = $1',
			[token],
		);
		return result.rows[0] ? this.mapToRefreshToken(result.rows[0]) : null;
	}

	async revokeRefreshToken(token: string, ip?: string): Promise<void> {
		await this.db.query(
			`UPDATE refresh_tokens 
       SET revoked_at = NOW(), revoked_by_ip = $2
       WHERE token = $1`,
			[token, ip],
		);
	}

	async revokeAllUserTokens(userId: string): Promise<void> {
		await this.db.query(
			`UPDATE refresh_tokens 
       SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
			[userId],
		);
	}

	async deleteExpiredTokens(): Promise<void> {
		await this.db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
	}

	async createUser(
		email: string,
		password: string,
		firstName?: string,
		lastName?: string,
	): Promise<IUser> {
		const result = await this.db.query(
			`INSERT INTO users (email, password, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
			[email, password, firstName, lastName],
		);
		return this.mapToUser(result.rows[0]);
	}
}
