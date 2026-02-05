import { PrismaClient } from '@prisma/client/extension';
import logger from '../utils/logger';

const prismaClientSingleton = () => {
	return new PrismaClient({
		log: [
			{ level: 'query', emit: 'event' },
			{ level: 'error', emit: 'event' },
			{ level: 'warn', emit: 'event' },
		],
	});
};

declare global {
	var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Log queries in development
if (process.env.NODE_ENV !== 'production') {
	prisma.$on('query', (e) => {
		logger.debug(
			{
				query: e.query,
				params: e.params,
				duration: `${e.duration}ms`,
			},
			'Prisma Query',
		);
	});
}

prisma.$on('error', (e) => {
	logger.error({ message: e.message }, 'Prisma Error');
});

if (process.env.NODE_ENV !== 'production') {
	globalThis.prisma = prisma;
}

export default prisma;
