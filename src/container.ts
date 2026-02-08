import { StateController } from '@Domain/state/state.controller';
import { StateRepository } from '@Domain/state/state.repository';
import { StateService } from '@Domain/state/state.service';
import { KeycloakMiddleware } from '@Middleware/keycloak';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export class Container {
	private static instance: Container;

	public prisma: PrismaClient;
	public stateController: StateController;
	public keycloakMiddleware: KeycloakMiddleware;

	private constructor() {
		// Database connection
		// @ts-ignore
		const connectionString = process.env.DATABASE_URL!;
		const adapter = new PrismaPg({ connectionString });
		this.prisma = new PrismaClient({
			adapter,
			log: ['info', 'error', 'query', 'warn'],
		});

		// State domain
		const stateRepository = new StateRepository(this.prisma);
		const stateService = new StateService(stateRepository);

		// Controllers
		this.stateController = new StateController(stateService);

		// Middleware
		this.keycloakMiddleware = new KeycloakMiddleware();
	}

	public static getInstance(): Container {
		if (!Container.instance) {
			Container.instance = new Container();
		}
		return Container.instance;
	}
}
