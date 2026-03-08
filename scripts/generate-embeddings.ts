/**
 * Generate embeddings for products in the database.
 * Usage:
 *   npx ts-node scripts/generate-embeddings.ts
 *   npx ts-node scripts/generate-embeddings.ts --force
 *   npx ts-node scripts/generate-embeddings.ts --productId=xxx
 *   npx ts-node scripts/generate-embeddings.ts --dry-run
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import ProductModel from '../src/models/product.model';
import EmbeddingUtil from '../src/utils/embedding.util';

const MONGO_URI = process.env.MONGO_URI;
const DELAY_BETWEEN_BATCHES_MS = 500;
const BATCH_SIZE = 5;

async function main() {
	const args = process.argv.slice(2);
	const force = args.includes('--force');
	const dryRun = args.includes('--dry-run');
	const productIdArg = args.find((a) => a.startsWith('--productId='));
	const productId = productIdArg?.split('=')[1];

	if (!MONGO_URI) {
		console.error('MONGO_URI is not set');
		process.exit(1);
	}

	if (!EmbeddingUtil.isConfigured()) {
		console.error('GEMINI_API_KEY is not set');
		process.exit(1);
	}

	await mongoose.connect(MONGO_URI);

	let products: any[];

	if (productId) {
		const p = await ProductModel.findById(productId);
		if (!p) {
			console.error(`Product not found: ${productId}`);
			process.exit(1);
		}
		products = [p];
	} else if (force) {
		products = await ProductModel.find({});
	} else {
		products = await ProductModel.find({
			$or: [
				{ embedding: null },
				{ embedding: { $exists: false } },
				{ embedding: { $size: 0 } },
			],
		});
	}

	console.log(
		`Found ${products.length} product(s) to process (force=${force}, dryRun=${dryRun})`,
	);

	if (dryRun) {
		console.log('Dry run - no changes made');
		process.exit(0);
	}

	let success = 0;
	let failed = 0;

	for (let i = 0; i < products.length; i += BATCH_SIZE) {
		const batch = products.slice(i, i + BATCH_SIZE);
		await Promise.all(
			batch.map(async (product) => {
				try {
					const text = EmbeddingUtil.createProductEmbeddingText({
						name: product.name,
						description: product.description,
						brief_description: product.brief_description,
						tags: product.tags,
						category: product.category,
						brand: product.brand,
						gender: product.gender,
					});
					const embedding = await EmbeddingUtil.generateEmbedding(text);
					await ProductModel.updateOne(
						{ _id: product._id },
						{ $set: { embedding } },
					);
					success++;
					console.log(`  ✓ ${product.name}`);
				} catch (err) {
					failed++;
					console.error(`  ✗ ${product.name}:`, err);
				}
			}),
		);
		if (i + BATCH_SIZE < products.length) {
			await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
		}
	}

	console.log(`\nDone: ${success} success, ${failed} failed`);
	await mongoose.disconnect();
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
