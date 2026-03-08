import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import ProductModel from '../src/models/product.model';
import UserModel from '../src/models/user.model';
import PurchaseModel from '../src/models/purchase.model';
import WishlistModel from '../src/models/wishlist.model';
import CartModel from '../src/models/cart.model';
import ProductViewModel from '../src/models/product-view.model';

const randomInt = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const randomSubset = <T>(arr: T[], count: number): T[] => {
	const shuffled = arr.slice().sort(() => 0.5 - Math.random());
	return shuffled.slice(0, Math.min(count, arr.length));
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomString = (len: number) => {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const PRODUCTS_DATA = [
	// ──── Shirts ────
	{
		name: 'Classic Fit Oxford Shirt',
		description: 'A timeless button-down oxford shirt crafted from premium 100% cotton. Features a relaxed classic fit with a button-down collar, chest pocket, and adjustable cuffs. Perfect for both office and casual wear.',
		brief_description: 'Premium cotton oxford shirt with classic fit',
		category: 'shirts',
		subcategory: 'oxford',
		brand: 'Brooks Brothers',
		price: 39.99,
		compare_at_price: 59.99,
		images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'],
		sizes: ['S', 'M', 'L', 'XL', 'XXL'],
		colors: ['White', 'Light Blue', 'Pink'],
		tags: ['classic', 'cotton', 'office', 'formal', 'button-down'],
		material: '100% Cotton',
		gender: 'men',
		stock: 200,
	},
	{
		name: 'Slim Fit Linen Shirt',
		description: 'Lightweight linen shirt designed for warm weather. Slim modern fit with a spread collar and mother-of-pearl buttons. Breathable and naturally moisture-wicking for all-day comfort.',
		brief_description: 'Lightweight slim-fit linen shirt for warm weather',
		category: 'shirts',
		subcategory: 'linen',
		brand: 'Uniqlo',
		price: 29.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600'],
		sizes: ['S', 'M', 'L', 'XL'],
		colors: ['White', 'Navy', 'Sage Green'],
		tags: ['linen', 'summer', 'casual', 'breathable', 'slim-fit'],
		material: '100% Linen',
		gender: 'men',
		stock: 150,
	},
	{
		name: 'Oversized Striped Shirt',
		description: 'Relaxed oversized shirt with vertical stripes. Drop shoulder design with a boxy silhouette. Made from soft cotton poplin for everyday comfort and effortless style.',
		brief_description: 'Relaxed oversized striped cotton shirt',
		category: 'shirts',
		subcategory: 'casual',
		brand: 'Zara',
		price: 35.99,
		compare_at_price: 45.99,
		images: ['https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600'],
		sizes: ['XS', 'S', 'M', 'L'],
		colors: ['Blue/White', 'Black/White', 'Green/White'],
		tags: ['oversized', 'striped', 'casual', 'trendy', 'cotton'],
		material: '100% Cotton Poplin',
		gender: 'women',
		stock: 120,
	},
	{
		name: 'Flannel Plaid Shirt',
		description: 'Warm brushed flannel shirt in a classic plaid pattern. Double-brushed for extra softness with a relaxed fit. Features dual chest pockets and durable snap buttons.',
		brief_description: 'Warm brushed flannel shirt in classic plaid',
		category: 'shirts',
		subcategory: 'flannel',
		brand: 'Carhartt',
		price: 44.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'],
		sizes: ['S', 'M', 'L', 'XL', 'XXL'],
		colors: ['Red/Black', 'Green/Navy', 'Brown/Tan'],
		tags: ['flannel', 'plaid', 'winter', 'warm', 'casual', 'outdoor'],
		material: '100% Brushed Cotton Flannel',
		gender: 'unisex',
		stock: 180,
	},

	// ──── T-Shirts ────
	{
		name: 'Essential Crew Neck Tee',
		description: 'Your everyday essential crew neck t-shirt. Made from ring-spun combed cotton for an ultra-soft feel. Pre-shrunk with a modern fit that works on its own or layered.',
		brief_description: 'Ultra-soft essential cotton crew neck tee',
		category: 't-shirts',
		subcategory: 'crew-neck',
		brand: 'Uniqlo',
		price: 14.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'],
		sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
		colors: ['White', 'Black', 'Navy', 'Grey', 'Olive'],
		tags: ['essential', 'basic', 'cotton', 'everyday', 'layering'],
		material: '100% Ring-Spun Combed Cotton',
		gender: 'unisex',
		stock: 500,
	},
	{
		name: 'Graphic Print Vintage Tee',
		description: 'Retro-inspired graphic t-shirt with a vintage washed finish. Features distressed print artwork with a relaxed boyfriend fit. Soft jersey knit fabric.',
		brief_description: 'Vintage-washed graphic print relaxed tee',
		category: 't-shirts',
		subcategory: 'graphic',
		brand: 'H&M',
		price: 19.99,
		compare_at_price: 24.99,
		images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec515c7?w=600'],
		sizes: ['XS', 'S', 'M', 'L', 'XL'],
		colors: ['Washed Black', 'Washed Grey', 'Washed Blue'],
		tags: ['graphic', 'vintage', 'retro', 'casual', 'print'],
		material: '100% Cotton Jersey',
		gender: 'unisex',
		stock: 300,
	},
	{
		name: 'V-Neck Pima Cotton Tee',
		description: 'Luxurious v-neck tee made from Pima cotton for exceptional softness and durability. Features a refined slim fit with reinforced seams and a slightly deeper neckline.',
		brief_description: 'Luxurious Pima cotton v-neck slim fit tee',
		category: 't-shirts',
		subcategory: 'v-neck',
		brand: 'Calvin Klein',
		price: 24.99,
		compare_at_price: 34.99,
		images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600'],
		sizes: ['S', 'M', 'L', 'XL'],
		colors: ['White', 'Black', 'Heather Grey'],
		tags: ['pima-cotton', 'luxury', 'slim-fit', 'v-neck', 'soft'],
		material: '100% Pima Cotton',
		gender: 'men',
		stock: 200,
	},

	// ──── Pants ────
	{
		name: 'Slim Fit Chinos',
		description: 'Versatile slim-fit chinos made from stretch cotton twill. Features a flat front with slant pockets, welt back pockets, and a zip fly. Perfect transition from work to weekend.',
		brief_description: 'Versatile stretch cotton slim-fit chinos',
		category: 'pants',
		subcategory: 'chinos',
		brand: 'Dockers',
		price: 49.99,
		compare_at_price: 69.99,
		images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600'],
		sizes: ['28', '30', '32', '34', '36', '38'],
		colors: ['Khaki', 'Navy', 'Olive', 'Black'],
		tags: ['chinos', 'slim-fit', 'stretch', 'office', 'casual', 'versatile'],
		material: '98% Cotton, 2% Elastane',
		gender: 'men',
		stock: 180,
	},
	{
		name: 'High-Rise Wide Leg Trousers',
		description: 'Elegant high-rise trousers with a flowing wide leg silhouette. Made from a draping crepe fabric with front pleats and side pockets. Perfect for creating a polished, elongated look.',
		brief_description: 'Elegant high-rise wide leg crepe trousers',
		category: 'pants',
		subcategory: 'trousers',
		brand: 'Zara',
		price: 55.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'],
		sizes: ['XS', 'S', 'M', 'L', 'XL'],
		colors: ['Black', 'Cream', 'Charcoal'],
		tags: ['wide-leg', 'high-rise', 'elegant', 'office', 'formal', 'trousers'],
		material: '95% Polyester, 5% Elastane',
		gender: 'women',
		stock: 120,
	},
	{
		name: 'Relaxed Fit Cargo Pants',
		description: 'Utility-inspired cargo pants with a relaxed fit. Features multiple cargo pockets, drawstring waist, and elasticated cuffs. Made from durable ripstop cotton.',
		brief_description: 'Durable ripstop cotton relaxed cargo pants',
		category: 'pants',
		subcategory: 'cargo',
		brand: 'Carhartt',
		price: 59.99,
		compare_at_price: 79.99,
		images: ['https://images.unsplash.com/photo-1517438476312-10d79c077509?w=600'],
		sizes: ['S', 'M', 'L', 'XL', 'XXL'],
		colors: ['Olive', 'Black', 'Khaki', 'Camo'],
		tags: ['cargo', 'utility', 'relaxed', 'outdoor', 'durable', 'streetwear'],
		material: '100% Ripstop Cotton',
		gender: 'unisex',
		stock: 160,
	},

	// ──── Jeans ────
	{
		name: 'Classic Straight Leg Jeans',
		description: 'Timeless straight leg jeans in medium-wash indigo denim. Features a mid-rise waist with a classic five-pocket design. Broken-in softness with no stretch for an authentic denim feel.',
		brief_description: 'Medium-wash classic straight leg denim jeans',
		category: 'jeans',
		subcategory: 'straight',
		brand: "Levi's",
		price: 69.99,
		compare_at_price: 89.99,
		images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'],
		sizes: ['28', '30', '32', '34', '36'],
		colors: ['Medium Wash', 'Dark Wash', 'Light Wash'],
		tags: ['classic', 'straight-leg', 'denim', 'indigo', 'everyday'],
		material: '100% Cotton Denim',
		gender: 'men',
		stock: 250,
	},
	{
		name: 'Skinny High-Rise Jeans',
		description: 'Figure-hugging skinny jeans with a high-rise waist. Super-stretch denim that moves with you while maintaining its shape. Features a clean dark wash with subtle whiskering.',
		brief_description: 'Super-stretch skinny high-rise dark wash jeans',
		category: 'jeans',
		subcategory: 'skinny',
		brand: "Levi's",
		price: 59.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600'],
		sizes: ['24', '26', '28', '30', '32'],
		colors: ['Dark Wash', 'Black', 'Medium Wash'],
		tags: ['skinny', 'high-rise', 'stretch', 'denim', 'fitted'],
		material: '92% Cotton, 6% Polyester, 2% Elastane',
		gender: 'women',
		stock: 200,
	},
	{
		name: 'Relaxed Tapered Jeans',
		description: 'Modern relaxed-fit jeans with a tapered leg. Features a comfortable mid-rise with room through the hip and thigh, narrowing at the ankle. Washed for a broken-in feel.',
		brief_description: 'Modern relaxed tapered mid-rise jeans',
		category: 'jeans',
		subcategory: 'tapered',
		brand: 'Uniqlo',
		price: 39.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600'],
		sizes: ['28', '30', '32', '34', '36', '38'],
		colors: ['Blue', 'Washed Black', 'Grey'],
		tags: ['relaxed', 'tapered', 'comfortable', 'denim', 'modern'],
		material: '99% Cotton, 1% Elastane',
		gender: 'unisex',
		stock: 180,
	},

	// ──── Jackets ────
	{
		name: 'Classic Denim Jacket',
		description: 'Iconic denim trucker jacket in a medium wash. Features button front closure, adjustable waist tabs, dual chest pockets, and side welt pockets. A wardrobe essential that layers over anything.',
		brief_description: 'Iconic medium-wash denim trucker jacket',
		category: 'jackets',
		subcategory: 'denim',
		brand: "Levi's",
		price: 89.99,
		compare_at_price: 119.99,
		images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600'],
		sizes: ['S', 'M', 'L', 'XL'],
		colors: ['Medium Wash', 'Dark Wash', 'Light Wash'],
		tags: ['denim', 'classic', 'trucker', 'layering', 'iconic'],
		material: '100% Cotton Denim',
		gender: 'unisex',
		stock: 100,
	},
	{
		name: 'Lightweight Puffer Jacket',
		description: 'Ultra-lightweight packable puffer jacket with synthetic insulation. Water-resistant shell with elastic cuffs and an adjustable hem. Packs into its own pocket for easy travel.',
		brief_description: 'Packable ultra-lightweight water-resistant puffer',
		category: 'jackets',
		subcategory: 'puffer',
		brand: 'Uniqlo',
		price: 69.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1544923246-77307dd270cb?w=600'],
		sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
		colors: ['Black', 'Navy', 'Olive', 'Burgundy'],
		tags: ['puffer', 'lightweight', 'packable', 'water-resistant', 'winter', 'travel'],
		material: '100% Nylon Shell, Synthetic Fill',
		gender: 'unisex',
		stock: 150,
	},
	{
		name: 'Wool Blend Overcoat',
		description: 'Sophisticated single-breasted overcoat in a premium wool blend. Features notch lapels, two-button closure, and a full lining. Hits just below the knee for a refined silhouette.',
		brief_description: 'Sophisticated single-breasted wool blend overcoat',
		category: 'jackets',
		subcategory: 'overcoat',
		brand: 'Calvin Klein',
		price: 199.99,
		compare_at_price: 299.99,
		images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600'],
		sizes: ['S', 'M', 'L', 'XL'],
		colors: ['Camel', 'Charcoal', 'Black'],
		tags: ['wool', 'overcoat', 'formal', 'winter', 'luxury', 'classic'],
		material: '70% Wool, 30% Polyester',
		gender: 'men',
		stock: 80,
	},
	{
		name: 'Cropped Leather Biker Jacket',
		description: 'Edgy cropped biker jacket in genuine leather. Asymmetric zip closure with snap lapels, zippered pockets, and quilted shoulder panels. A statement piece for any outfit.',
		brief_description: 'Genuine leather cropped biker jacket',
		category: 'jackets',
		subcategory: 'leather',
		brand: 'AllSaints',
		price: 349.99,
		compare_at_price: 449.99,
		images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'],
		sizes: ['XS', 'S', 'M', 'L'],
		colors: ['Black', 'Cognac'],
		tags: ['leather', 'biker', 'cropped', 'edgy', 'statement', 'premium'],
		material: '100% Genuine Leather',
		gender: 'women',
		stock: 50,
	},

	// ──── Dresses ────
	{
		name: 'Floral Midi Wrap Dress',
		description: 'Flattering midi-length wrap dress in a vibrant floral print. Features a true wrap front with an adjustable tie waist, flutter sleeves, and a flowing A-line skirt.',
		brief_description: 'Vibrant floral print midi wrap dress',
		category: 'dresses',
		subcategory: 'wrap',
		brand: '& Other Stories',
		price: 79.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600'],
		sizes: ['XS', 'S', 'M', 'L', 'XL'],
		colors: ['Blue Floral', 'Red Floral', 'Green Floral'],
		tags: ['floral', 'wrap', 'midi', 'summer', 'feminine', 'elegant'],
		material: '100% Viscose',
		gender: 'women',
		stock: 100,
	},
	{
		name: 'Little Black Dress',
		description: 'An elevated take on the classic LBD. Sleek shift silhouette with a round neckline, invisible back zip, and above-knee length. Crafted from stretch crepe for a smooth, flattering fit.',
		brief_description: 'Sleek stretch crepe shift little black dress',
		category: 'dresses',
		subcategory: 'shift',
		brand: 'Calvin Klein',
		price: 99.99,
		compare_at_price: 139.99,
		images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],
		sizes: ['XS', 'S', 'M', 'L'],
		colors: ['Black'],
		tags: ['LBD', 'classic', 'formal', 'elegant', 'cocktail', 'evening'],
		material: '95% Polyester, 5% Elastane',
		gender: 'women',
		stock: 90,
	},
	{
		name: 'Casual Cotton Maxi Dress',
		description: 'Effortless cotton maxi dress with a relaxed fit. Features adjustable spaghetti straps, a smocked bodice, and tiered skirt. Perfect for beach days and summer outings.',
		brief_description: 'Effortless cotton tiered maxi dress',
		category: 'dresses',
		subcategory: 'maxi',
		brand: 'H&M',
		price: 34.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600'],
		sizes: ['XS', 'S', 'M', 'L', 'XL'],
		colors: ['White', 'Terracotta', 'Blue'],
		tags: ['maxi', 'cotton', 'summer', 'beach', 'casual', 'tiered'],
		material: '100% Cotton',
		gender: 'women',
		stock: 140,
	},

	// ──── Sweaters / Knitwear ────
	{
		name: 'Merino Wool Crew Sweater',
		description: 'Fine-gauge merino wool sweater with a classic crew neckline. Lightweight yet warm, with ribbed cuffs and hem. Naturally temperature-regulating and odor-resistant.',
		brief_description: 'Fine-gauge merino wool classic crew sweater',
		category: 'sweaters',
		subcategory: 'crew',
		brand: 'J.Crew',
		price: 79.99,
		compare_at_price: 98.00,
		images: ['https://images.unsplash.com/photo-1434389677669-e08b4cda3a91?w=600'],
		sizes: ['S', 'M', 'L', 'XL'],
		colors: ['Navy', 'Heather Grey', 'Burgundy', 'Forest Green'],
		tags: ['merino', 'wool', 'crew-neck', 'classic', 'layering', 'winter'],
		material: '100% Merino Wool',
		gender: 'men',
		stock: 120,
	},
	{
		name: 'Chunky Cable Knit Cardigan',
		description: 'Cozy oversized cardigan with a chunky cable knit pattern. Features shawl collar, toggle button closure, and deep patch pockets. A warm layering staple for cold days.',
		brief_description: 'Cozy oversized chunky cable knit cardigan',
		category: 'sweaters',
		subcategory: 'cardigan',
		brand: 'Ralph Lauren',
		price: 129.99,
		compare_at_price: 169.99,
		images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'],
		sizes: ['XS', 'S', 'M', 'L', 'XL'],
		colors: ['Cream', 'Charcoal', 'Oatmeal'],
		tags: ['cable-knit', 'cardigan', 'oversized', 'cozy', 'winter', 'layering'],
		material: '60% Wool, 40% Acrylic',
		gender: 'women',
		stock: 80,
	},
	{
		name: 'Cashmere Turtleneck',
		description: 'Indulgent pure cashmere turtleneck sweater. Incredibly soft with a regular fit, ribbed turtleneck collar, cuffs and hem. A luxurious wardrobe investment piece.',
		brief_description: 'Pure cashmere luxury turtleneck sweater',
		category: 'sweaters',
		subcategory: 'turtleneck',
		brand: 'Everlane',
		price: 149.99,
		compare_at_price: 199.99,
		images: ['https://images.unsplash.com/photo-1581497396202-5645e76a3a8e?w=600'],
		sizes: ['XS', 'S', 'M', 'L'],
		colors: ['Black', 'Camel', 'Grey', 'Ivory'],
		tags: ['cashmere', 'turtleneck', 'luxury', 'winter', 'premium', 'soft'],
		material: '100% Cashmere',
		gender: 'unisex',
		stock: 60,
	},

	// ──── Shorts ────
	{
		name: 'Chino Bermuda Shorts',
		description: 'Classic bermuda-length chino shorts in stretch cotton. Features a flat front, belt loops, and a 9-inch inseam. A polished warm-weather essential.',
		brief_description: 'Classic stretch cotton bermuda chino shorts',
		category: 'shorts',
		subcategory: 'chino',
		brand: 'Dockers',
		price: 34.99,
		compare_at_price: 44.99,
		images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600'],
		sizes: ['28', '30', '32', '34', '36'],
		colors: ['Khaki', 'Navy', 'Stone'],
		tags: ['bermuda', 'chino', 'summer', 'classic', 'cotton'],
		material: '98% Cotton, 2% Elastane',
		gender: 'men',
		stock: 160,
	},
	{
		name: 'Athletic Running Shorts',
		description: 'Performance running shorts with built-in liner. Features moisture-wicking DRY-EX fabric, reflective details, and a zippered back pocket. Lightweight 5-inch inseam for maximum mobility.',
		brief_description: 'Moisture-wicking performance running shorts',
		category: 'shorts',
		subcategory: 'athletic',
		brand: 'Nike',
		price: 29.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1562886877-aaaa5c17965a?w=600'],
		sizes: ['S', 'M', 'L', 'XL'],
		colors: ['Black', 'Navy', 'Grey'],
		tags: ['athletic', 'running', 'performance', 'sport', 'moisture-wicking'],
		material: '100% Recycled Polyester',
		gender: 'unisex',
		stock: 220,
	},
	{
		name: 'High-Waist Denim Shorts',
		description: 'Vintage-inspired high-waist denim shorts with a raw hem. Made from rigid denim with a flattering A-line shape. Five-pocket styling with copper rivets.',
		brief_description: 'Vintage-inspired high-waist raw hem denim shorts',
		category: 'shorts',
		subcategory: 'denim',
		brand: "Levi's",
		price: 44.99,
		compare_at_price: 54.99,
		images: ['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600'],
		sizes: ['24', '26', '28', '30', '32'],
		colors: ['Light Wash', 'Medium Wash', 'White'],
		tags: ['denim', 'high-waist', 'vintage', 'summer', 'raw-hem'],
		material: '100% Cotton Denim',
		gender: 'women',
		stock: 140,
	},

	// ──── Activewear ────
	{
		name: 'Compression Training Leggings',
		description: 'High-performance compression leggings for training and yoga. Features four-way stretch fabric, wide waistband with hidden pocket, and flatlock seams. Squat-proof and moisture-wicking.',
		brief_description: 'High-performance compression training leggings',
		category: 'activewear',
		subcategory: 'leggings',
		brand: 'Nike',
		price: 54.99,
		compare_at_price: 74.99,
		images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600'],
		sizes: ['XS', 'S', 'M', 'L', 'XL'],
		colors: ['Black', 'Navy', 'Burgundy', 'Olive'],
		tags: ['leggings', 'compression', 'training', 'yoga', 'sport', 'moisture-wicking'],
		material: '78% Nylon, 22% Spandex',
		gender: 'women',
		stock: 200,
	},
	{
		name: 'Tech Fleece Joggers',
		description: 'Modern tech fleece joggers with a tapered fit. Double-knit spacer fabric provides warmth without bulk. Features zippered pockets and elastic ankle cuffs.',
		brief_description: 'Modern tapered tech fleece joggers',
		category: 'activewear',
		subcategory: 'joggers',
		brand: 'Nike',
		price: 64.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600'],
		sizes: ['S', 'M', 'L', 'XL', 'XXL'],
		colors: ['Black', 'Heather Grey', 'Navy'],
		tags: ['joggers', 'tech-fleece', 'athleisure', 'comfortable', 'modern'],
		material: '66% Cotton, 34% Polyester',
		gender: 'men',
		stock: 170,
	},
	{
		name: 'Sports Bra - Medium Support',
		description: 'Supportive and stylish medium-impact sports bra. Features removable pads, racerback design, and a wide elastic band. Perfect for yoga, pilates, and cycling.',
		brief_description: 'Medium-support racerback sports bra',
		category: 'activewear',
		subcategory: 'sports-bra',
		brand: 'Adidas',
		price: 34.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600'],
		sizes: ['XS', 'S', 'M', 'L', 'XL'],
		colors: ['Black', 'White', 'Dusty Rose', 'Teal'],
		tags: ['sports-bra', 'medium-support', 'yoga', 'fitness', 'racerback'],
		material: '80% Nylon, 20% Spandex',
		gender: 'women',
		stock: 190,
	},

	// ──── Accessories ────
	{
		name: 'Leather Belt',
		description: 'Classic dress belt crafted from full-grain leather. Features a polished nickel buckle and stitched edges. 1.25 inches wide, perfect for dress pants and jeans alike.',
		brief_description: 'Full-grain leather classic dress belt',
		category: 'accessories',
		subcategory: 'belts',
		brand: 'Ralph Lauren',
		price: 49.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'],
		sizes: ['S (28-30)', 'M (32-34)', 'L (36-38)', 'XL (40-42)'],
		colors: ['Black', 'Brown', 'Tan'],
		tags: ['leather', 'belt', 'classic', 'dress', 'accessory'],
		material: '100% Full-Grain Leather',
		gender: 'men',
		stock: 250,
	},
	{
		name: 'Wool Blend Scarf',
		description: 'Oversized wool blend scarf with fringed ends. Ultra-soft and warm, large enough to wear as a wrap or shawl. Herringbone weave pattern adds a refined touch.',
		brief_description: 'Oversized herringbone wool blend scarf',
		category: 'accessories',
		subcategory: 'scarves',
		brand: 'Everlane',
		price: 39.99,
		compare_at_price: 55.00,
		images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600'],
		sizes: ['One Size'],
		colors: ['Camel', 'Grey', 'Black', 'Burgundy'],
		tags: ['scarf', 'wool', 'winter', 'accessory', 'herringbone', 'warm'],
		material: '70% Wool, 30% Acrylic',
		gender: 'unisex',
		stock: 130,
	},
	{
		name: 'Canvas Tote Bag',
		description: 'Sturdy canvas tote bag with leather handles. Spacious main compartment with interior zip pocket. Reinforced base and riveted handle attachments for durability.',
		brief_description: 'Sturdy canvas tote with leather handles',
		category: 'accessories',
		subcategory: 'bags',
		brand: 'Everlane',
		price: 44.99,
		compare_at_price: null,
		images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=600'],
		sizes: ['One Size'],
		colors: ['Natural', 'Black', 'Navy'],
		tags: ['tote', 'canvas', 'bag', 'everyday', 'durable', 'accessory'],
		material: '100% Cotton Canvas, Leather Trim',
		gender: 'unisex',
		stock: 180,
	},
];

function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

function generateSku(brand: string, index: number): string {
	const prefix = brand.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
	return `${prefix}-${String(index).padStart(4, '0')}`;
}

const seedFakeData = async () => {
	try {
		console.log('=== Lab15 Seed Script ===\n');
		const mongoUri = process.env.MONGO_URI;
		if (!mongoUri) {
			console.error('MONGO_URI is not defined in .env');
			process.exit(1);
		}

		console.log('Connecting to MongoDB...');
		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});
		console.log('Connected!\n');

		// ── Step 1: Seed Products ──
		const existingProducts = await ProductModel.countDocuments();
		let productIds: mongoose.Types.ObjectId[];

		if (existingProducts > 0) {
			console.log(`Found ${existingProducts} existing products, skipping product creation.`);
			const products = await ProductModel.find({}, '_id').lean();
			productIds = products.map((p: any) => p._id);
		} else {
			console.log(`Inserting ${PRODUCTS_DATA.length} products...`);
			const productsToInsert = PRODUCTS_DATA.map((p, i) => ({
				...p,
				sku: generateSku(p.brand, i + 1),
				url_slug: generateSlug(p.name),
				views: randomInt(0, 500),
			}));
			const created = await ProductModel.insertMany(productsToInsert);
			productIds = created.map((p) => p._id as mongoose.Types.ObjectId);
			console.log(`  ✓ Created ${created.length} products\n`);
		}

		// ── Step 2: Seed Users ──
		const NUM_FAKE_USERS = 50;
		const existingFakeUsers = await UserModel.countDocuments({ email: /^fake_/ });

		let userIds: mongoose.Types.ObjectId[];

		if (existingFakeUsers >= NUM_FAKE_USERS) {
			console.log(`Found ${existingFakeUsers} existing fake users, skipping user creation.`);
			const users = await UserModel.find({ email: /^fake_/ }, '_id').lean();
			userIds = users.map((u: any) => u._id);
		} else {
			console.log(`Creating ${NUM_FAKE_USERS} fake users...`);
			const usersData = Array.from({ length: NUM_FAKE_USERS }, (_, i) => ({
				username: `user_${randomString(6)}`,
				email: `fake_${randomString(8)}@example.com`,
				password: '$2b$10$EpOk.d.3.6.8.0.2.4.6.8',
				status: 'active',
				verify: true,
				roles: ['USER'],
			}));
			const createdUsers = await UserModel.insertMany(usersData);
			userIds = createdUsers.map((u) => u._id as mongoose.Types.ObjectId);
			console.log(`  ✓ Created ${createdUsers.length} users\n`);
		}

		// ── Step 3: Seed ProductViews ──
		const existingViews = await ProductViewModel.countDocuments();
		if (existingViews > 100) {
			console.log(`Found ${existingViews} existing product views, skipping.`);
		} else {
			console.log('Generating product views...');
			const views: any[] = [];
			for (const userId of userIds) {
				const numViews = randomInt(5, 20);
				const viewedProducts = randomSubset(productIds, numViews);
				for (const productId of viewedProducts) {
					views.push({
						product_id: productId,
						user_id: userId,
						ip_address: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
						viewedAt: new Date(Date.now() - randomInt(0, 30 * 86400000)),
					});
				}
			}
			await ProductViewModel.insertMany(views);
			console.log(`  ✓ Created ${views.length} product views\n`);
		}

		// ── Step 4: Seed Wishlists ──
		const existingWishlists = await WishlistModel.countDocuments();
		if (existingWishlists > 50) {
			console.log(`Found ${existingWishlists} existing wishlists, skipping.`);
		} else {
			console.log('Generating wishlists...');
			const wishlists: any[] = [];
			const seenPairs = new Set<string>();
			for (const userId of userIds) {
				const numWished = randomInt(1, 8);
				const wishedProducts = randomSubset(productIds, numWished);
				for (const productId of wishedProducts) {
					const key = `${userId}-${productId}`;
					if (!seenPairs.has(key)) {
						seenPairs.add(key);
						wishlists.push({
							user_id: userId,
							product_id: productId,
						});
					}
				}
			}
			await WishlistModel.insertMany(wishlists, { ordered: false }).catch(() => {});
			console.log(`  ✓ Created ${wishlists.length} wishlist entries\n`);
		}

		// ── Step 5: Seed Purchases ──
		const existingPurchases = await PurchaseModel.countDocuments();
		if (existingPurchases > 20) {
			console.log(`Found ${existingPurchases} existing purchases, skipping.`);
		} else {
			console.log('Generating purchases...');
			const allProducts = await ProductModel.find({}).lean();
			const productMap = new Map(allProducts.map((p: any) => [String(p._id), p]));

			const purchases: any[] = [];
			for (const userId of userIds) {
				const numOrders = randomInt(1, 4);
				for (let o = 0; o < numOrders; o++) {
					const numItems = randomInt(1, 4);
					const purchasedProducts = randomSubset(productIds, numItems);
					const items = purchasedProducts.map((pid) => {
						const product = productMap.get(String(pid));
						return {
							product_id: pid,
							size: product?.sizes?.length ? pick(product.sizes) : '',
							color: product?.colors?.length ? pick(product.colors) : '',
							quantity: randomInt(1, 3),
							price: product?.price || 29.99,
						};
					});
					const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
					purchases.push({
						user_id: userId,
						items,
						total: Math.round(total * 100) / 100,
						status: 'completed',
						createdAt: new Date(Date.now() - randomInt(0, 90 * 86400000)),
					});
				}
			}
			await PurchaseModel.insertMany(purchases);
			console.log(`  ✓ Created ${purchases.length} purchases\n`);
		}

		// ── Step 6: Seed Carts ──
		const existingCarts = await CartModel.countDocuments();
		if (existingCarts > 10) {
			console.log(`Found ${existingCarts} existing carts, skipping.`);
		} else {
			console.log('Generating carts...');
			const allProducts = await ProductModel.find({}).lean();
			const productMap = new Map(allProducts.map((p: any) => [String(p._id), p]));

			const carts: any[] = [];
			const usersWithCarts = randomSubset(userIds, Math.floor(userIds.length * 0.6));
			for (const userId of usersWithCarts) {
				const numItems = randomInt(1, 5);
				const cartProducts = randomSubset(productIds, numItems);
				const items = cartProducts.map((pid) => {
					const product = productMap.get(String(pid));
					return {
						product_id: pid,
						size: product?.sizes?.length ? pick(product.sizes) : '',
						color: product?.colors?.length ? pick(product.colors) : '',
						quantity: randomInt(1, 2),
					};
				});
				carts.push({ user_id: userId, items });
			}
			await CartModel.insertMany(carts).catch(() => {});
			console.log(`  ✓ Created ${carts.length} carts\n`);
		}

		// ── Summary ──
		console.log('=== Seed Summary ===');
		console.log(`Products:     ${await ProductModel.countDocuments()}`);
		console.log(`Users:        ${await UserModel.countDocuments()}`);
		console.log(`ProductViews: ${await ProductViewModel.countDocuments()}`);
		console.log(`Wishlists:    ${await WishlistModel.countDocuments()}`);
		console.log(`Purchases:    ${await PurchaseModel.countDocuments()}`);
		console.log(`Carts:        ${await CartModel.countDocuments()}`);
		console.log('\n✓ Seed completed successfully!');

		await mongoose.disconnect();
		process.exit(0);
	} catch (error) {
		console.error('Error seeding data:', error);
		await mongoose.disconnect();
		process.exit(1);
	}
};

seedFakeData();
