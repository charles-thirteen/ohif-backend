export class AppError extends Error {
	constructor(
		public code: number,
		public message: string,
		public isOperational: boolean = true,
	) {
		super(message);
		Object.setPrototypeOf(this, AppError.prototype);
		Error.captureStackTrace(this, this.constructor);

		this.name = this.constructor.name;
	}

	// Convenience static methods
	static badRequest(message: string): AppError {
		return new AppError(400, message);
	}

	static unauthorized(message: string = 'Unauthorized'): AppError {
		return new AppError(401, message);
	}

	static forbidden(message: string = 'Forbidden'): AppError {
		return new AppError(403, message);
	}

	static notFound(message: string = 'Resource not found'): AppError {
		return new AppError(404, message);
	}

	static conflict(message: string): AppError {
		return new AppError(409, message);
	}

	static internal(message: string = 'Internal server error'): AppError {
		return new AppError(500, message, false); // Non-operational
	}
}
