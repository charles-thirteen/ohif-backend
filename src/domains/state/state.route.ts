import { Router } from 'express';
import type { KeycloakMiddleware } from '@Middleware/keycloak';
import type { StateController } from './state.controller';

export const createStateRoutes = (
	stateController: StateController,
	keycloakMiddleware: KeycloakMiddleware,
): Router => {
	const router = Router();

	// All routes require Keycloak authentication
	router.use(keycloakMiddleware.authenticate);

	// Preferences endpoints
	router.get('/preferences', stateController.getPreferences);
	router.put('/preferences', stateController.savePreferences);

	// Annotations endpoints (studyUID contains dots like 1.2.840.113619...)
	router.get('/annotations/:studyUID', stateController.getAnnotations);
	router.put('/annotations/:studyUID', stateController.saveAnnotations);
	router.delete('/annotations/:studyUID', stateController.deleteAnnotations);

	return router;
};
