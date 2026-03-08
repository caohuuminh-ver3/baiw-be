import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
	@IsString()
	name!: string;

	@IsString()
	description!: string;

	@IsString()
	brief_description!: string;

	@IsString()
	category!: string;

	@IsOptional()
	@IsString()
	subcategory?: string;

	@IsString()
	brand!: string;

	@IsNumber()
	price!: number;

	@IsOptional()
	@IsNumber()
	compare_at_price?: number;

	@IsArray()
	@IsString({ each: true })
	images!: string[];

	@IsArray()
	@IsString({ each: true })
	sizes!: string[];

	@IsArray()
	@IsString({ each: true })
	colors!: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tags?: string[];

	@IsOptional()
	@IsString()
	material?: string;

	@IsOptional()
	@IsString()
	gender?: string;

	@IsOptional()
	@IsNumber()
	stock?: number;

	@IsString()
	sku!: string;

	@IsString()
	url_slug!: string;
}

export class UpdateProductDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	brief_description?: string;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	subcategory?: string;

	@IsOptional()
	@IsString()
	brand?: string;

	@IsOptional()
	@IsNumber()
	price?: number;

	@IsOptional()
	@IsNumber()
	compare_at_price?: number;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	images?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	sizes?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	colors?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tags?: string[];

	@IsOptional()
	@IsString()
	material?: string;

	@IsOptional()
	@IsString()
	gender?: string;

	@IsOptional()
	@IsNumber()
	stock?: number;

	@IsOptional()
	@IsString()
	sku?: string;

	@IsOptional()
	@IsString()
	url_slug?: string;
}
