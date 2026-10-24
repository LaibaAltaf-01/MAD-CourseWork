// ===== Colours =====
export const colors = {
  bg: '#FFF6F9', ink: '#3A2A4D', muted: '#6B5A7C', white: '#FFFFFF',
  pink: '#FF8FB1', pinkLight: '#FFD0E0', pinkSoft: '#FFE0EA',
  lavender: '#C9B6FF', lavenderLight: '#E6DAFF',
  mint: '#A8EBD0', mintLight: '#CFEFE0',
  sky: '#8EC9FF', skyLight: '#CBE6FF', skyBg: '#DDF0FF',
  butter: '#FFE9A0',
};

// ===== Fonts =====
export const fonts = {
  heading: 'Fredoka_700Bold',
  headingMedium: 'Fredoka_600SemiBold',
  body: 'Nunito_700Bold',
  bodyBold: 'Nunito_800ExtraBold',
};

// ===== Settings / shopping rules =====
export const API_URL = 'https://fakestoreapi.com/products';
export const PRICE_FACTOR = 10;     // API prices are small, so price x 10 = Rs.
export const DISCOUNT_MIN = 1200;   // discount applies only when subtotal is above this amount
export const DISCOUNT_RATE = 0.2;   // 20%
export const BANNER_TEXT = '20% OFF on Shopping Above Rs. 1,200 — Available Till 20 October';

export async function fetchStoreProducts() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Product request failed with status ${response.status}.`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Product service returned an invalid response.');
  }

  return data.map((product) => {
    const category = (product.category || '').toLowerCase();
    const originalPrice = Math.round(product.price * PRICE_FACTOR);
    const isClothing = category.includes('clothing');
    return {
      id: 'api-' + product.id,
      name: product.title,
      price: isClothing ? Math.round(originalPrice * (1 - DISCOUNT_RATE)) : originalPrice,
      originalPrice: isClothing ? originalPrice : undefined,
      discountPercent: isClothing ? Math.round(DISCOUNT_RATE * 100) : undefined,
      description: product.description,
      image: product.image,
      category,
    };
  });
}

// ===== Helper functions =====
// 1500 -> "Rs. 1,500"
export function formatPrice(amount) {
  return 'Rs. ' + String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Subtotals greater than Rs. 1,200 receive 20% off.
export function calculateTotals(subtotal) {
  const discount = subtotal > DISCOUNT_MIN ? Math.round(subtotal * DISCOUNT_RATE) : 0;
  return { subtotal, discount, finalAmount: subtotal - discount };
}

// ===== Products (Accessories + Clothes). Makeup comes from the API. =====
// GROUP (Male/Female) -> CATEGORY (Watches, Stitched...) -> PRODUCTS
// image = bundled product photo, icon = fallback, color = tile background
export const ACCESSORY_GROUPS = [
  {
    id: 'male', label: 'For Him', genderIcon: 'male', accent: colors.sky, bg: colors.skyBg,
    categories: [
      { id: 'm-wallets', title: 'Purses / Wallets', icon: 'wallet', products: [
        { id: 'acc-m1', name: 'Bifold Wallet', price: 1450, image: require('../assets/products/accessory-bifold-wallet.jpg'), icon: 'wallet', color: colors.mintLight, description: 'Classic bifold wallet with card slots and a coin pocket.' },
        { id: 'acc-m2', name: 'Slim Card Holder', price: 890, image: require('../assets/products/accessory-slim-card-holder.jpg'), icon: 'card-account-details', color: colors.lavenderLight, description: 'Super slim holder that fits easily in any pocket.' },
      ] },
      { id: 'm-watches', title: 'Watches', icon: 'watch', products: [
        { id: 'acc-m3', name: 'Minimal Steel Watch', price: 3200, image: require('../assets/products/accessory-steel-watch.jpg'), icon: 'watch', color: colors.skyLight, description: 'Clean dial with a steel strap. Goes with everything.' },
        { id: 'acc-m4', name: 'Sport Strap Watch', price: 2450, image: require('../assets/products/accessory-sport-watch.jpg'), icon: 'watch-variant', color: colors.butter, description: 'Light sporty watch with a soft, comfortable strap.' },
      ] },
    ],
  },
  {
    id: 'female', label: 'For Her', genderIcon: 'female', accent: colors.pink, bg: colors.pinkSoft,
    categories: [
      { id: 'f-jewellery', title: 'Jewellery', icon: 'diamond-stone', products: [
        { id: 'acc-f1', name: 'Pearl Drop Necklace', price: 1250, image: require('../assets/products/accessory-pearl-necklace.jpg'), icon: 'necklace', color: colors.pinkLight, description: 'Delicate necklace with a single pearl drop.' },
        { id: 'acc-f2', name: 'Rose Gem Ring', price: 980, image: require('../assets/products/accessory-rose-ring.jpg'), icon: 'diamond-stone', color: colors.butter, description: 'Rose-gold style ring with a sparkly pink gem.' },
      ] },
      { id: 'f-purses', title: 'Purses', icon: 'purse', products: [
        { id: 'acc-f3', name: 'Mini Crossbody Purse', price: 2100, image: require('../assets/products/accessory-crossbody-purse.jpg'), icon: 'purse', color: colors.lavenderLight, description: 'Small crossbody purse, big enough for the essentials.' },
        { id: 'acc-f4', name: 'Everyday Tote Bag', price: 2650, image: require('../assets/products/accessory-everyday-tote.jpg'), icon: 'bag-personal', color: colors.mintLight, description: 'Roomy tote for university, work or shopping.' },
      ] },
    ],
  },
];

export const CLOTHES_GROUPS = [
  {
    id: 'male', label: 'Male', genderIcon: 'male', accent: colors.sky, bg: colors.skyBg,
    categories: [
      { id: 'c-m-stitched', title: 'Stitched', icon: 'tshirt-crew', products: [
        { id: 'clo-m1', name: 'Cotton Kurta', price: 2400, image: require('../assets/products/clothing-cotton-kurta.jpg'), icon: 'tshirt-crew', color: colors.skyLight, description: 'Soft cotton kurta, ready to wear.' },
        { id: 'clo-m2', name: 'Casual Shirt', price: 1900, image: require('../assets/products/clothing-casual-shirt.jpg'), icon: 'tshirt-crew-outline', color: colors.mintLight, description: 'Relaxed-fit casual shirt for everyday wear.' },
      ] },
      { id: 'c-m-unstitched', title: 'Unstitched', icon: 'texture-box', products: [
        { id: 'clo-m3', name: 'Wash & Wear Fabric', price: 1800, image: require('../assets/products/clothing-wash-wear-fabric.jpg'), icon: 'texture-box', color: colors.mintLight, description: 'Easy-care fabric, enough for one full suit.' },
        { id: 'clo-m4', name: 'Cotton Suit Fabric', price: 2200, image: require('../assets/products/clothing-cotton-suit-fabric.jpg'), icon: 'texture-box', color: colors.butter, description: 'Breathable cotton fabric for summer suits.' },
      ] },
    ],
  },
  {
    id: 'female', label: 'Female', genderIcon: 'female', accent: colors.pink, bg: colors.pinkSoft,
    categories: [
      { id: 'c-f-stitched', title: 'Stitched', icon: 'hanger', products: [
        { id: 'clo-f1', name: 'Embroidered Kurti', price: 2900, image: require('../assets/products/clothing-embroidered-kurti.jpg'), icon: 'hanger', color: colors.pinkLight, description: 'Cotton kurti with soft embroidery on the neckline.' },
        { id: 'clo-f2', name: 'Printed Co-ord Set', price: 3200, image: require('../assets/products/clothing-printed-coord-set.jpg'), icon: 'hanger', color: colors.lavenderLight, description: 'Matching printed top and trouser set.' },
      ] },
      { id: 'c-f-unstitched', title: 'Unstitched', icon: 'texture-box', products: [
        { id: 'clo-f3', name: 'Lawn 3-Piece Suit', price: 3500, image: require('../assets/products/clothing-lawn-suit.jpg'), icon: 'texture-box', color: colors.butter, description: 'Printed lawn shirt, dupatta and trouser fabric.' },
        { id: 'clo-f4', name: 'Chiffon Dupatta Suit', price: 4100, image: require('../assets/products/clothing-chiffon-dupatta.jpg'), icon: 'texture-box', color: colors.lavenderLight, description: 'Light chiffon dupatta with embroidered shirt fabric.' },
      ] },
    ],
  },
];

export const MAKEUP_PRODUCTS = [
  {
    id: 'makeup-1',
    name: 'Everyday Makeup Edit',
    price: 1850,
    image: require('../assets/products/makeup-blush-palette.jpg'),
    icon: 'palette',
    color: colors.pinkSoft,
    category: 'makeup',
    description: 'A feel-good edit of blush, lip color, and everyday beauty essentials.',
  },
  {
    id: 'makeup-2',
    name: 'Soft Glam Palette',
    price: 1450,
    image: require('../assets/products/makeup-lipstick.jpg'),
    icon: 'palette',
    color: colors.lavenderLight,
    category: 'makeup',
    description: 'Warm, wearable shades for an easy day-to-night look.',
  },
  {
    id: 'makeup-3',
    name: 'Pro Makeup Brush Set',
    price: 1250,
    image: require('../assets/products/makeup-brush-set.jpg'),
    icon: 'brush',
    color: colors.butter,
    category: 'makeup',
    description: 'A curated set of soft brushes for blending and finishing.',
  },
  {
    id: 'makeup-4',
    name: 'Dew Drop Face Serum',
    price: 1100,
    image: require('../assets/products/makeup-serum.jpg'),
    icon: 'bottle-tonic',
    color: colors.mintLight,
    category: 'makeup',
    description: 'A lightweight hydrating serum for a fresh, dewy base.',
  },
];

export const JEWELRY_GROUPS = [
  {
    id: 'jewelry', label: 'Jewelry', genderIcon: 'diamond', accent: colors.pink, bg: colors.pinkSoft,
    categories: [
      { id: 'necklaces', title: 'Necklaces', icon: 'necklace', products: [
        { id: 'jew-1', name: 'Pearl Halo Necklace', price: 2150, icon: 'necklace', color: colors.pinkLight, description: 'Soft pearl necklace with a subtle statement shine.' },
        { id: 'jew-2', name: 'Gold Charm Chain', price: 2650, icon: 'necklace', color: colors.butter, description: 'Minimal chain with a charm-inspired drop design.' },
      ] },
      { id: 'rings', title: 'Rings', icon: 'diamond-stone', products: [
        { id: 'jew-3', name: 'Rose Gold Ring', price: 1800, icon: 'diamond-stone', color: colors.lavenderLight, description: 'Soft romantic ring for daily styling.' },
        { id: 'jew-4', name: 'Crystal Accent Ring', price: 2050, icon: 'diamond-stone', color: colors.skyLight, description: 'A sparkle ring with a modern, elegant finish.' },
      ] },
    ],
  },
];

export const ELECTRONICS_GROUPS = [
  {
    id: 'electronics', label: 'Electronics', genderIcon: 'laptop', accent: colors.sky, bg: colors.skyBg,
    categories: [
      { id: 'audio', title: 'Audio', icon: 'headphones', products: [
        { id: 'tech-1', name: 'Wireless Earbuds', price: 4200, icon: 'headphones', color: colors.skyLight, description: 'Pocket-friendly earbuds with crisp sound and long battery life.' },
        { id: 'tech-2', name: 'Portable Speaker', price: 5100, icon: 'speaker', color: colors.mintLight, description: 'Cute mini speaker for work desks, bedrooms, and travel.' },
      ] },
      { id: 'gadgets', title: 'Smart Tech', icon: 'devices', products: [
        { id: 'tech-3', name: 'Smart Watch', price: 6800, icon: 'watch', color: colors.butter, description: 'Track your steps, calls, and notifications in style.' },
        { id: 'tech-4', name: 'LED Desk Lamp', price: 3900, icon: 'lamp', color: colors.lavenderLight, description: 'Minimal desk lamp with adjustable light mode and soft glow.' },
      ] },
    ],
  },
];