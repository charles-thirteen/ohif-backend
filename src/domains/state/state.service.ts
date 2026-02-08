import logger from '@Util/logger';
import type { IStateRepository } from './state.interface';

export class StateService {
	constructor(private stateRepository: IStateRepository) {}

	async getPreferences(userId: string): Promise<any | null> {
		logger.info({ userId }, 'Fetching user preferences');

		const pref = await this.stateRepository.getPreferences(userId);
		if (!pref) {
			return null;
		}

		return JSON.parse(pref.data);
	}

	async savePreferences(userId: string, body: any): Promise<void> {
		logger.info({ userId }, 'Saving user preferences');

		const data = JSON.stringify(body);
		await this.stateRepository.upsertPreferences(userId, data);
	}

	async getAnnotations(userId: string, studyUid: string): Promise<{ annotations: any[] }> {
		logger.info({ userId, studyUid }, 'Fetching annotations');

		const annotation = await this.stateRepository.getAnnotations(userId, studyUid);
		if (!annotation) {
			return { annotations: [] };
		}

		return JSON.parse(annotation.data);
	}

	async saveAnnotations(userId: string, studyUid: string, body: any): Promise<void> {
		logger.info({ userId, studyUid }, 'Saving annotations');

		const data = JSON.stringify(body);
		await this.stateRepository.upsertAnnotations(userId, studyUid, data);
	}

	async deleteAnnotations(userId: string, studyUid: string): Promise<void> {
		logger.info({ userId, studyUid }, 'Deleting annotations');

		await this.stateRepository.deleteAnnotations(userId, studyUid);
	}
}
