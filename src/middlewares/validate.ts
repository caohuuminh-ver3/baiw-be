import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';

export default function validateDto(dtoClass: any) {
	return async (req: Request, res: Response, next: NextFunction) => {
		const output = plainToInstance(dtoClass, req.body);
		const errors = await validate(output, {
			whitelist: true,
			forbidNonWhitelisted: true,
		});
		if (errors.length > 0) {
			const formattedErrors = errors.map((error) => ({
				property: error.property,
				constraints: error.constraints,
				value: error.value,
			}));
			const fieldErrors = errors.reduce(
				(acc, error) => {
					if (error.constraints) {
						acc[error.property] = Object.values(error.constraints);
					}
					return acc;
				},
				{} as Record<string, string[]>
			);
			return res.status(400).json({
				status: 'error',
				code: 400,
				message: fieldErrors,
				errors: formattedErrors,
			});
		}
		req.body = output;
		return next();
	};
}
