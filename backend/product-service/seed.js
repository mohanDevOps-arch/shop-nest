// Seeds the product catalog with sample categories and products.
// Usage: npm run seed  (WARNING: replaces all existing products and categories)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const Product = require('./models/Product');

dotenv.config();

const image = (id, alt) => ({
  url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`,
  alt
});

const categories = [
  {
    name: 'Electronics',
    description: 'Headphones, cameras, laptops and the latest gadgets',
    image: image('1498049794561-7780e7231661', 'Electronics')
  },
  {
    name: 'Fashion',
    description: 'Clothing, footwear and accessories for every style',
    image: image('1441986300917-64674bd600d8', 'Fashion')
  },
  {
    name: 'Home & Living',
    description: 'Furniture, decor and kitchen essentials',
    image: image('1484101403633-562f891dc89a', 'Home and living')
  },
  {
    name: 'Books & Stationery',
    description: 'Best-selling reads, journals and notebooks',
    image: image('1495446815901-a7297e633e8d', 'Books')
  },
  {
    name: 'Sports & Outdoors',
    description: 'Fitness gear, cycling and camping equipment',
    image: image('1461896836934-ffe607ba8211', 'Sports and outdoors')
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Skincare, fragrance and makeup',
    image: image('1596462502278-27bfdc403348', 'Beauty products')
  }
];

// category is the category name; it is swapped for the ObjectId on insert
const products = [
  // Electronics
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Over-ear Bluetooth headphones with active noise cancellation, 30-hour battery life and plush memory-foam ear cushions. Quick charge gives 5 hours of playback in 10 minutes.',
    price: 199.99,
    category: 'Electronics',
    brand: 'SoundCore',
    images: [image('1505740420928-5e560c06d30e', 'Wireless headphones')],
    inventory: { stock: 45, sku: 'ELEC-HP-001' },
    specifications: { weight: 250, color: 'Matte Black', material: 'Aluminium / Protein Leather' },
    ratings: { average: 4.7, count: 328 },
    tags: ['audio', 'bluetooth', 'noise-cancelling'],
    featured: true
  },
  {
    name: 'Retro Instant Film Camera',
    description: 'Capture memories instantly with this retro-styled instant camera. Automatic exposure, built-in flash and a selfie mirror make every shot easy.',
    price: 89.99,
    category: 'Electronics',
    brand: 'Lumio',
    images: [image('1526170375885-4d8ecf77b99f', 'Instant film camera')],
    inventory: { stock: 30, sku: 'ELEC-CAM-002' },
    specifications: { weight: 480, color: 'Mint', material: 'ABS Plastic' },
    ratings: { average: 4.5, count: 142 },
    tags: ['camera', 'photography', 'gift'],
    featured: true
  },
  {
    name: 'UltraBook Pro 14" Laptop',
    description: '14-inch ultra-thin laptop with a 2.8K display, 16GB RAM, 512GB NVMe SSD and all-day battery. Perfect for work, study and creative projects.',
    price: 1149.0,
    category: 'Electronics',
    brand: 'Nimbus',
    images: [image('1496181133206-80ce9b88a853', 'Laptop on a desk')],
    inventory: { stock: 12, sku: 'ELEC-LAP-003' },
    specifications: { weight: 1300, dimensions: { length: 31.2, width: 22.1, height: 1.5 }, color: 'Space Grey', material: 'Aluminium' },
    ratings: { average: 4.6, count: 87 },
    tags: ['laptop', 'computer', 'work'],
    featured: true
  },
  {
    name: 'Pixel Edge 5G Smartphone',
    description: '6.4-inch OLED smartphone with a triple-lens camera system, 128GB storage, 5G connectivity and fast wireless charging.',
    price: 699.0,
    category: 'Electronics',
    brand: 'Nimbus',
    images: [image('1511707171634-5f897ff02aa9', 'Smartphone')],
    inventory: { stock: 25, sku: 'ELEC-PHN-004' },
    specifications: { weight: 187, color: 'Midnight', material: 'Glass / Aluminium' },
    ratings: { average: 4.4, count: 215 },
    tags: ['phone', '5g', 'mobile']
  },
  {
    name: 'Mechanical RGB Keyboard',
    description: 'Compact 75% mechanical keyboard with hot-swappable tactile switches, per-key RGB lighting and USB-C / Bluetooth dual mode.',
    price: 129.5,
    category: 'Electronics',
    brand: 'KeyForge',
    images: [image('1587829741301-dc798b83add3', 'Mechanical keyboard')],
    inventory: { stock: 8, sku: 'ELEC-KB-005' },
    specifications: { weight: 820, color: 'White', material: 'Aluminium / PBT' },
    ratings: { average: 4.8, count: 96 },
    tags: ['keyboard', 'gaming', 'office']
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Waterproof (IPX7) portable speaker with 360° sound, deep bass and 20 hours of playtime. Pair two for stereo sound.',
    price: 59.99,
    category: 'Electronics',
    brand: 'SoundCore',
    images: [image('1608043152269-423dbba4e7e1', 'Bluetooth speaker')],
    inventory: { stock: 60, sku: 'ELEC-SPK-006' },
    specifications: { weight: 540, color: 'Charcoal', material: 'Fabric / Silicone' },
    ratings: { average: 4.3, count: 174 },
    tags: ['audio', 'bluetooth', 'outdoor']
  },

  // Fashion
  {
    name: 'Classic Minimalist Watch',
    description: 'Timeless analog watch with a sapphire-coated crystal, Japanese quartz movement and a genuine leather strap. Water-resistant to 50m.',
    price: 149.0,
    category: 'Fashion',
    brand: 'Hora',
    images: [image('1523275335684-37898b6baf30', 'Minimalist watch')],
    inventory: { stock: 20, sku: 'FASH-WAT-001' },
    specifications: { weight: 60, color: 'Silver / Tan', material: 'Stainless Steel / Leather' },
    ratings: { average: 4.6, count: 203 },
    tags: ['watch', 'accessories', 'gift'],
    featured: true
  },
  {
    name: 'Air Runner Sneakers',
    description: 'Lightweight everyday sneakers with breathable mesh upper and responsive foam cushioning for all-day comfort.',
    price: 119.99,
    category: 'Fashion',
    brand: 'Stride',
    images: [image('1542291026-7eec264c27ff', 'Red sneakers')],
    inventory: { stock: 35, sku: 'FASH-SNK-002' },
    specifications: { weight: 310, color: 'Red', material: 'Mesh / Rubber' },
    ratings: { average: 4.5, count: 412 },
    tags: ['shoes', 'sneakers', 'casual'],
    featured: true
  },
  {
    name: 'Polarized Aviator Sunglasses',
    description: 'Classic aviator sunglasses with polarized lenses offering 100% UV400 protection and a lightweight metal frame.',
    price: 39.99,
    category: 'Fashion',
    brand: 'Solis',
    images: [image('1572635196237-14b3f281503f', 'Sunglasses')],
    inventory: { stock: 75, sku: 'FASH-SUN-003' },
    specifications: { weight: 30, color: 'Gold / Green', material: 'Metal' },
    ratings: { average: 4.2, count: 88 },
    tags: ['sunglasses', 'accessories', 'summer']
  },
  {
    name: 'Essential Cotton T-Shirt',
    description: 'Soft, breathable 100% organic cotton crew-neck t-shirt with a relaxed fit. A wardrobe staple that goes with everything.',
    price: 19.99,
    category: 'Fashion',
    brand: 'Basics Co.',
    images: [image('1521572163474-6864f9cf17ab', 'White t-shirt')],
    inventory: { stock: 150, sku: 'FASH-TEE-004' },
    specifications: { weight: 180, color: 'White', material: 'Organic Cotton' },
    ratings: { average: 4.4, count: 530 },
    tags: ['t-shirt', 'cotton', 'basics']
  },
  {
    name: 'Vintage Denim Jacket',
    description: 'Classic trucker-style denim jacket with a vintage wash, button front and chest pockets. Layers perfectly year-round.',
    price: 79.0,
    category: 'Fashion',
    brand: 'Indigo Lane',
    images: [image('1576871337622-98d48d1cf531', 'Denim jacket')],
    inventory: { stock: 18, sku: 'FASH-JKT-005' },
    specifications: { weight: 750, color: 'Light Wash Blue', material: 'Denim' },
    ratings: { average: 4.6, count: 67 },
    tags: ['jacket', 'denim', 'outerwear']
  },
  {
    name: 'Fleece Pullover Hoodie',
    description: 'Cozy brushed-fleece hoodie with a kangaroo pocket and adjustable drawstring hood. Pre-shrunk for a consistent fit.',
    price: 44.99,
    category: 'Fashion',
    brand: 'Basics Co.',
    images: [image('1556821840-3a63f95609a7', 'Hoodie')],
    inventory: { stock: 0, sku: 'FASH-HOD-006' },
    specifications: { weight: 520, color: 'Heather Grey', material: 'Cotton / Polyester' },
    ratings: { average: 4.7, count: 245 },
    tags: ['hoodie', 'loungewear', 'winter']
  },
  {
    name: 'Trail Pro Running Shoes',
    description: 'Grippy, cushioned running shoes built for road and trail, with a reinforced toe cap and quick-dry lining.',
    price: 134.99,
    category: 'Fashion',
    brand: 'Stride',
    images: [image('1600185365483-26d7a4cc7519', 'Running shoes')],
    inventory: { stock: 22, sku: 'FASH-RUN-007' },
    specifications: { weight: 290, color: 'Grey / Orange', material: 'Knit / Rubber' },
    ratings: { average: 4.5, count: 139 },
    tags: ['shoes', 'running', 'sport']
  },

  // Home & Living
  {
    name: 'Handcrafted Ceramic Mug',
    description: 'Hand-glazed 12oz stoneware mug, microwave and dishwasher safe. Each piece has a unique finish.',
    price: 16.5,
    category: 'Home & Living',
    brand: 'Kiln & Co.',
    images: [image('1514228742587-6b1558fcca3d', 'Ceramic mug')],
    inventory: { stock: 90, sku: 'HOME-MUG-001' },
    specifications: { weight: 350, color: 'Speckled White', material: 'Stoneware' },
    ratings: { average: 4.8, count: 310 },
    tags: ['kitchen', 'coffee', 'gift']
  },
  {
    name: 'Mid-Century Accent Chair',
    description: 'Upholstered accent chair with solid wood legs and high-density foam seat. Adds a pop of style to any living room or reading nook.',
    price: 249.0,
    category: 'Home & Living',
    brand: 'Nordhaus',
    images: [image('1567538096630-e0c55bd6374c', 'Accent chair')],
    inventory: { stock: 6, sku: 'HOME-CHR-002' },
    specifications: { weight: 9500, dimensions: { length: 70, width: 68, height: 82 }, color: 'Mustard Yellow', material: 'Velvet / Beech Wood' },
    ratings: { average: 4.4, count: 52 },
    tags: ['furniture', 'living room', 'chair'],
    featured: true
  },
  {
    name: 'Modern Table Lamp',
    description: 'Sleek table lamp with a fabric shade and warm dimmable LED. Ideal for bedside tables and desks.',
    price: 54.99,
    category: 'Home & Living',
    brand: 'Lumen',
    images: [image('1507473885765-e6ed057f782c', 'Table lamp')],
    inventory: { stock: 28, sku: 'HOME-LMP-003' },
    specifications: { weight: 1200, color: 'White / Brass', material: 'Linen / Metal' },
    ratings: { average: 4.3, count: 74 },
    tags: ['lighting', 'decor', 'bedroom']
  },
  {
    name: 'Indoor Plant with Ceramic Pot',
    description: 'Easy-care indoor plant delivered in a minimalist ceramic pot with drainage tray. Brings life to any room.',
    price: 32.0,
    category: 'Home & Living',
    brand: 'Greenhouse',
    images: [image('1485955900006-10f4d324d411', 'Potted plant')],
    inventory: { stock: 40, sku: 'HOME-PLT-004' },
    specifications: { weight: 1800, color: 'Terracotta', material: 'Ceramic' },
    ratings: { average: 4.6, count: 118 },
    tags: ['plants', 'decor', 'gift']
  },
  {
    name: 'Artisan Coffee Cup & Saucer Set',
    description: 'Set of 2 porcelain cappuccino cups with matching saucers. Perfect for your morning brew or entertaining guests.',
    price: 28.99,
    category: 'Home & Living',
    brand: 'Kiln & Co.',
    images: [image('1495474472287-4d71bcdd2085', 'Coffee cup')],
    inventory: { stock: 55, sku: 'HOME-CUP-005' },
    specifications: { weight: 600, color: 'White', material: 'Porcelain' },
    ratings: { average: 4.5, count: 61 },
    tags: ['kitchen', 'coffee']
  },

  // Books & Stationery
  {
    name: 'The Art of Simple Living',
    description: 'A bestselling guide to slowing down, decluttering and finding joy in everyday moments. Hardcover, 288 pages.',
    price: 24.99,
    category: 'Books & Stationery',
    brand: 'Brightside Press',
    images: [image('1544947950-fa07a98d237f', 'Hardcover book')],
    inventory: { stock: 70, sku: 'BOOK-ASL-001' },
    specifications: { weight: 450, material: 'Hardcover' },
    ratings: { average: 4.7, count: 892 },
    tags: ['books', 'self-help', 'bestseller'],
    featured: true
  },
  {
    name: 'Classic Novels Collection (5 Books)',
    description: 'A curated boxed set of five beloved classic novels in elegant paperback editions. A perfect gift for book lovers.',
    price: 49.99,
    category: 'Books & Stationery',
    brand: 'Evergreen Classics',
    images: [image('1512820790803-83ca734da794', 'Stack of books')],
    inventory: { stock: 25, sku: 'BOOK-CLS-002' },
    specifications: { weight: 1600, material: 'Paperback' },
    ratings: { average: 4.8, count: 156 },
    tags: ['books', 'fiction', 'gift']
  },
  {
    name: 'Dotted Grid Notebook A5',
    description: 'Lay-flat A5 notebook with 160 pages of 100gsm dotted paper, a ribbon marker and elastic closure. Great for journaling and sketching.',
    price: 14.99,
    category: 'Books & Stationery',
    brand: 'Inkwell',
    images: [image('1531346878377-a5be20888e57', 'Notebook')],
    inventory: { stock: 120, sku: 'BOOK-NTB-003' },
    specifications: { weight: 300, color: 'Black', material: 'Paper / Vegan Leather' },
    ratings: { average: 4.6, count: 204 },
    tags: ['stationery', 'journal', 'notebook']
  },

  // Sports & Outdoors
  {
    name: 'Eco Yoga Mat',
    description: 'Non-slip 6mm yoga mat made from natural tree rubber with alignment lines. Includes a carrying strap.',
    price: 49.0,
    category: 'Sports & Outdoors',
    brand: 'ZenFlow',
    images: [image('1601925260368-ae2f83cf8b7f', 'Yoga mat')],
    inventory: { stock: 38, sku: 'SPRT-YGA-001' },
    specifications: { weight: 2300, dimensions: { length: 183, width: 61, height: 0.6 }, color: 'Sage Green', material: 'Natural Rubber' },
    ratings: { average: 4.6, count: 177 },
    tags: ['yoga', 'fitness', 'eco']
  },
  {
    name: 'Adjustable Dumbbell Set',
    description: 'Space-saving adjustable dumbbells from 2.5kg to 24kg each with a quick-change dial. Replaces 15 sets of weights.',
    price: 299.0,
    category: 'Sports & Outdoors',
    brand: 'IronCore',
    images: [image('1583454110551-21f2fa2afe61', 'Dumbbells')],
    inventory: { stock: 9, sku: 'SPRT-DMB-002' },
    specifications: { weight: 48000, color: 'Black', material: 'Steel' },
    ratings: { average: 4.7, count: 98 },
    tags: ['fitness', 'weights', 'home gym']
  },
  {
    name: 'City Commuter Bicycle',
    description: 'Lightweight 7-speed city bike with an aluminium frame, comfort saddle and front basket mount. Ready to ride out of the box.',
    price: 459.0,
    category: 'Sports & Outdoors',
    brand: 'Velo',
    images: [image('1485965120184-e220f721d03e', 'Bicycle')],
    inventory: { stock: 5, sku: 'SPRT-BIK-003' },
    specifications: { weight: 12500, color: 'Matte Teal', material: 'Aluminium' },
    ratings: { average: 4.5, count: 41 },
    tags: ['cycling', 'commute', 'outdoor']
  },
  {
    name: 'Insulated Steel Water Bottle',
    description: 'Double-wall vacuum-insulated 750ml bottle that keeps drinks cold for 24 hours or hot for 12. BPA-free and leak-proof.',
    price: 24.99,
    category: 'Sports & Outdoors',
    brand: 'Hydra',
    images: [image('1602143407151-7111542de6e8', 'Water bottle')],
    inventory: { stock: 140, sku: 'SPRT-BTL-004' },
    specifications: { weight: 380, color: 'Ocean Blue', material: 'Stainless Steel' },
    ratings: { average: 4.8, count: 621 },
    tags: ['hydration', 'outdoor', 'eco']
  },
  {
    name: '4-Person Camping Tent',
    description: 'Weatherproof dome tent for four with a rainfly, mesh windows and a 10-minute setup. Packs down small for easy transport.',
    price: 179.99,
    category: 'Sports & Outdoors',
    brand: 'Summit',
    images: [image('1504280390367-361c6d9f38f4', 'Camping tent')],
    inventory: { stock: 14, sku: 'SPRT-TNT-005' },
    specifications: { weight: 5200, color: 'Forest Green', material: 'Polyester / Fibreglass' },
    ratings: { average: 4.4, count: 83 },
    tags: ['camping', 'outdoor', 'hiking']
  },
  {
    name: 'Everyday Travel Backpack',
    description: 'Water-resistant 25L backpack with a padded 15" laptop sleeve, hidden anti-theft pocket and luggage strap.',
    price: 69.99,
    category: 'Sports & Outdoors',
    brand: 'Summit',
    images: [image('1553062407-98eeb64c6a62', 'Backpack')],
    inventory: { stock: 33, sku: 'SPRT-BPK-006' },
    specifications: { weight: 900, color: 'Olive', material: 'Recycled Polyester' },
    ratings: { average: 4.6, count: 266 },
    tags: ['travel', 'backpack', 'outdoor'],
    featured: true
  },

  // Beauty & Personal Care
  {
    name: 'Eau de Parfum — Amber Bloom',
    description: 'A warm, floral fragrance with notes of jasmine, amber and vanilla. Long-lasting 50ml eau de parfum.',
    price: 85.0,
    category: 'Beauty & Personal Care',
    brand: 'Maison Lune',
    images: [image('1541643600914-78b084683601', 'Perfume bottle')],
    inventory: { stock: 26, sku: 'BEAU-PRF-001' },
    specifications: { weight: 220, material: 'Glass' },
    ratings: { average: 4.5, count: 132 },
    tags: ['fragrance', 'perfume', 'gift']
  },
  {
    name: 'Hydrating Skincare Essentials Kit',
    description: 'Gentle cleanser, hyaluronic serum and daily moisturiser in one routine-ready kit. Suitable for all skin types.',
    price: 54.0,
    category: 'Beauty & Personal Care',
    brand: 'Dew Lab',
    images: [image('1556228578-8c89e6adf883', 'Skincare products')],
    inventory: { stock: 44, sku: 'BEAU-SKN-002' },
    specifications: { weight: 400 },
    ratings: { average: 4.6, count: 189 },
    tags: ['skincare', 'routine', 'hydrating']
  },
  {
    name: 'Velvet Matte Lipstick',
    description: 'Highly pigmented, long-wear matte lipstick enriched with vitamin E. Comfortable, non-drying formula.',
    price: 18.0,
    category: 'Beauty & Personal Care',
    brand: 'Rouge',
    images: [image('1586495777744-4413f21062fa', 'Lipstick')],
    inventory: { stock: 7, sku: 'BEAU-LIP-003' },
    specifications: { weight: 20, color: 'Ruby Red' },
    ratings: { average: 4.3, count: 97 },
    tags: ['makeup', 'lipstick']
  }
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_products');
  console.log('Connected to MongoDB');

  await Product.deleteMany({});
  await Category.deleteMany({});

  // create() runs per-document middleware, so each category gets its slug
  const createdCategories = await Category.create(categories);
  const categoryIds = Object.fromEntries(createdCategories.map(c => [c.name, c._id]));

  await Product.create(products.map(p => ({ ...p, category: categoryIds[p.category] })));

  console.log(`Seeded ${createdCategories.length} categories and ${products.length} products`);
};

seed()
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
