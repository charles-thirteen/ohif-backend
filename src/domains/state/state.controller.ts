import type { Request, Response, NextFunction } from 'express';
import type { StateService } from './state.service';

export class StateController {
	constructor(private stateService: StateService) {}

	getPreferences = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user!.id;
			const preferences = await this.stateService.getPreferences(userId);

			res.json(preferences);
		} catch (error) {
			next(error);
		}
	};

	savePreferences = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user!.id;
			await this.stateService.savePreferences(userId, req.body);

			res.json({ success: true });
		} catch (error) {
			next(error);
		}
	};

	getAnnotations = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user!.id;
			const { studyUID } = req.params;
			const annotations = await this.stateService.getAnnotations(userId, studyUID);

			res.json(annotations);
		} catch (error) {
			next(error);
		}
	};

	saveAnnotations = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user!.id;
			const { studyUID } = req.params;
			await this.stateService.saveAnnotations(userId, studyUID, req.body);

			res.json({ success: true });
		} catch (error) {
			next(error);
		}
	};

	deleteAnnotations = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user!.id;
			const { studyUID } = req.params;
			await this.stateService.deleteAnnotations(userId, studyUID);

			res.json({ success: true });
		} catch (error) {
			next(error);
		}
	};
}
