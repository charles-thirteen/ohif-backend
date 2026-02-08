import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AppError } from '@Class/error';
import logger from '@Util/logger';

interface KeycloakTokenPayload {
	sub: string;
	email?: string;
	preferred_username?: string;
	azp?: string;
	aud?: string | string[];
	iss?: string;
	exp?: number;
	iat?: number;
}

const KEYCLOAK_REALM_URL =
	process.env.KEYCLOAK_REALM_URL || 'http://localhost:8080/realms/ohif';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'ohif-viewer';

const client = jwksClient({
	jwksUri: `${KEYCLOAK_REALM_URL}/protocol/openid-connect/certs`,
	cache: true,
	cacheMaxAge: 600000, // 10 minutes
	rateLimit: true,
	jwksRequestsPerMinute: 10,
});

function getKey(
	header: jwt.JwtHeader,
	callback: (err: Error | null, key?: string) => void,
): void {
	client.getSigningKey(header.kid, (err, key) => {
		if (err) {
			callback(err);
			return;
		}
		const signingKey = key?.getPublicKey();
		callback(null, signingKey);
	});
}

export class KeycloakMiddleware {
	authenticate = (req: Request, res: Response, next: NextFunction): void => {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			next(AppError.unauthorized('No token provided'));
			return;
		}

		const token = authHeader.substring(7);

		jwt.verify(
			token,
			getKey,
			{
				algorithms: ['RS256'],
				issuer: KEYCLOAK_REALM_URL,
			},
			(err, decoded) => {
				if (err) {
					logger.warn({ error: err.message }, 'Keycloak token verification failed');
					next(AppError.unauthorized('Invalid token'));
					return;
				}

				const payload = decoded as KeycloakTokenPayload;

				// Validate audience/client
				const audience = payload.azp || payload.aud;
				const validAudience = Array.isArray(audience)
					? audience.includes(KEYCLOAK_CLIENT_ID)
					: audience === KEYCLOAK_CLIENT_ID;

				if (!validAudience) {
					logger.warn({ audience }, 'Invalid token audience');
					next(AppError.unauthorized('Invalid token audience'));
					return;
				}

				// Attach user to request using sub as id
				req.user = {
					id: payload.sub,
					email: payload.email || payload.preferred_username || '',
				};

				next();
			},
		);
	};
}
