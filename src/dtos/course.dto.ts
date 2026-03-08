import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
	@IsString()
	title!: string;

	@IsString()
	summary!: string;

	@IsString()
	brief_summary!: string;
}

export class UpdateCourseDto {
	@IsOptional()
	@IsString()
	title?: string;

	@IsOptional()
	@IsString()
	summary?: string;

	@IsOptional()
	@IsString()
	brief_summary?: string;
}

/**
 * DTO for recomputing course embeddings
 * Used with query params: ?force=true&courseId=abc123
 */
export class RecomputeEmbeddingsDto {
	@IsOptional()
	@Transform(({ value }) => value === 'true')
	@IsBoolean()
	force?: boolean;

	@IsOptional()
	@IsMongoId()
	courseId?: string;
}
