import type { AppError } from '@Class/error';

type FulfilledRequest<T> = [undefined, T];
type RejectedRequest = [Error | AppError];

export default async function catchError<T>(
	fn: Promise<T>,
): Promise<FulfilledRequest<T> | RejectedRequest> {
	return fn
		.then((data) => {
			return [undefined, data] as FulfilledRequest<T>;
		})
		.catch((error) => {
			return [error] as RejectedRequest;
		});
}
