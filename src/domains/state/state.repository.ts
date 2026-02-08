import type { PrismaClient } from 'src/generated/prisma/client';
import type { IStateRepository, IUserPreference, IUserAnnotation } from './state.interface';

export class StateRepository implements IStateRepository {
	constructor(private prisma: PrismaClient) {}

	private mapToPreference(pref: any): IUserPreference {
		return {
			userId: pref.userId,
			data: pref.data,
			updatedAt: pref.updatedAt,
		};
	}

	private mapToAnnotation(annotation: any): IUserAnnotation {
		return {
			userId: annotation.userId,
			studyUid: annotation.studyUid,
			data: annotation.data,
			updatedAt: annotation.updatedAt,
		};
	}

	async getPreferences(userId: string): Promise<IUserPreference | null> {
		const pref = await this.prisma.userPreference.findUnique({
			where: { userId },
		});
		return pref ? this.mapToPreference(pref) : null;
	}

	async upsertPreferences(userId: string, data: string): Promise<IUserPreference> {
		const pref = await this.prisma.userPreference.upsert({
			where: { userId },
			update: { data },
			create: { userId, data },
		});
		return this.mapToPreference(pref);
	}

	async getAnnotations(userId: string, studyUid: string): Promise<IUserAnnotation | null> {
		const annotation = await this.prisma.userAnnotation.findUnique({
			where: {
				userId_studyUid: { userId, studyUid },
			},
		});
		return annotation ? this.mapToAnnotation(annotation) : null;
	}

	async upsertAnnotations(
		userId: string,
		studyUid: string,
		data: string,
	): Promise<IUserAnnotation> {
		const annotation = await this.prisma.userAnnotation.upsert({
			where: {
				userId_studyUid: { userId, studyUid },
			},
			update: { data },
			create: { userId, studyUid, data },
		});
		return this.mapToAnnotation(annotation);
	}

	async deleteAnnotations(userId: string, studyUid: string): Promise<void> {
		await this.prisma.userAnnotation.deleteMany({
			where: { userId, studyUid },
		});
	}
}
