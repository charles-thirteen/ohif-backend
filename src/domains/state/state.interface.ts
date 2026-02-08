export interface IUserPreference {
	userId: string;
	data: string;
	updatedAt: Date;
}

export interface IUserAnnotation {
	userId: string;
	studyUid: string;
	data: string;
	updatedAt: Date;
}

export interface IStateRepository {
	// Preferences
	getPreferences(userId: string): Promise<IUserPreference | null>;
	upsertPreferences(userId: string, data: string): Promise<IUserPreference>;

	// Annotations
	getAnnotations(userId: string, studyUid: string): Promise<IUserAnnotation | null>;
	upsertAnnotations(userId: string, studyUid: string, data: string): Promise<IUserAnnotation>;
	deleteAnnotations(userId: string, studyUid: string): Promise<void>;
}
