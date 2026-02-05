export interface IUser {
	id: string;
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
	isActive: boolean;
	lastLoginAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface IUserResponse {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	createdAt: Date;
}

export interface IRegisterDTO {
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
}

export interface ILoginDTO {
	email: string;
	password: string;
}

export interface IAuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface ITokenPayload {
	userId: string;
	email: string;
	type: 'access' | 'refresh';
}

export interface IRefreshToken {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
	createdByIp?: string;
	revokedAt?: Date;
	revokedByIp?: string;
	replacedByToken?: string;
	isActive: boolean;
}
