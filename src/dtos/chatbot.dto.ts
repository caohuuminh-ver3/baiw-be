import {
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength,
} from 'class-validator';

export class SendMessageDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(1)
	message!: string;

	@IsOptional()
	@IsString()
	session_id?: string;

	@IsOptional()
	@IsString()
	course_id?: string;
}
