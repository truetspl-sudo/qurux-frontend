export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: string;
  priceNum: number;
  image: string;
  description: string;
  stock: number;
  ingredients: string[];
  howToUse: string[];
  benefits: string[];
  idealFor: string;
  goodToKnow: string[];
}

export const staticProducts: ProductDetail[] = [
  {
    id: "p1",
    slug: "essn-hd-foundation",
    name: "ESSN HD Foundation",
    category: "Makeup",
    price: "₹1,299",
    priceNum: 1299,
    image: "/cards/buy.jpg",
    description:
      "High-definition foundation for a smooth, camera-ready finish. Buildable coverage that looks flawless on camera and in person.",
    stock: 25,
    ingredients: [
      "Aqua (Water)",
      "Dimethicone",
      "Cyclopentasiloxane",
      "Glycerin",
      "Titanium Dioxide",
      "Iron Oxides",
      "Niacinamide",
      "Hyaluronic Acid",
      "Vitamin E",
    ],
    howToUse: [
      "Start with a clean, moisturised face.",
      "Apply a small amount to the back of your hand.",
      "Use a makeup sponge or brush to blend evenly.",
      "Build coverage in layers as needed.",
      "Set with a light dusting of loose powder for long wear.",
    ],
    benefits: [
      "High-definition, camera-ready finish",
      "Buildable medium-to-full coverage",
      "Lightweight and comfortable on skin",
      "Non-comedogenic — won't clog pores",
      "Enriched with Hyaluronic Acid for hydration",
      "Suitable for all skin tones",
    ],
    idealFor:
      "Anyone looking for a smooth, professional finish — perfect for events, daily wear, and photography.",
    goodToKnow: [
      "Available in multiple shades.",
      "Cruelty-free and paraben-free.",
      "Patch test recommended for sensitive skin.",
    ],
  },
  {
    id: "p2",
    slug: "essn-matte-lipstick-set",
    name: "ESSN Matte Lipstick Set",
    category: "Makeup",
    price: "₹899",
    priceNum: 899,
    image: "/cards/buy.jpg",
    description:
      "Set of 6 long-lasting matte lipsticks in trending shades. Smooth application with rich, vibrant colour payoff.",
    stock: 40,
    ingredients: [
      "Ricinus Communis (Castor) Oil",
      "Candelilla Wax",
      "Kaolin Clay",
      "Vitamin E",
      "Jojoba Oil",
      "Cocoa Butter",
      "Iron Oxides",
      "Titanium Dioxide",
    ],
    howToUse: [
      "Exfoliate and moisturise lips before application.",
      "Start from the centre of your upper lip.",
      "Apply outward towards the corners.",
      "Repeat on the lower lip.",
      "Blot with tissue for a matte finish, or layer for intensity.",
    ],
    benefits: [
      "6 stunning shades for every occasion",
      "Long-lasting matte finish — up to 8 hours",
      "Smooth, non-drying formula",
      "Rich colour payoff in a single swipe",
      "Enriched with Vitamin E and Jojoba Oil",
      "Lightweight and comfortable wear",
    ],
    idealFor:
      "Lipstick lovers who want vibrant, long-lasting colour without drying their lips.",
    goodToKnow: [
      "Smudge-proof and transfer-resistant.",
      "Cruelty-free formulation.",
      "Shades may vary slightly from screen to actual product.",
    ],
  },
  {
    id: "p3",
    slug: "essn-glow-serum",
    name: "ESSN Glow Serum",
    category: "Skincare",
    price: "₹1,499",
    priceNum: 1499,
    image: "/cards/buy.jpg",
    description:
      "Vitamin C glow serum for radiant and even-toned skin. Lightweight formula that absorbs quickly and brightens skin over time.",
    stock: 30,
    ingredients: [
      "L-Ascorbic Acid (Vitamin C) 15%",
      "Hyaluronic Acid",
      "Niacinamide",
      "Ferulic Acid",
      "Aloe Vera Extract",
      "Vitamin E",
      "Green Tea Extract",
    ],
    howToUse: [
      "After cleansing and toning, take 3-4 drops on your palm.",
      "Gently press and pat onto face and neck.",
      "Avoid the eye area.",
      "Follow with moisturiser and sunscreen.",
      "Use morning and evening for best results.",
    ],
    benefits: [
      "Brightens skin and evens out skin tone",
      "Reduces dark spots and pigmentation",
      "Boosts collagen production",
      "Powerful antioxidant protection",
      "Hydrates and plumps skin",
      "Lightweight, fast-absorbing formula",
    ],
    idealFor:
      "Anyone wanting brighter, more radiant skin — especially for dullness, dark spots, or uneven skin tone.",
    goodToKnow: [
      "Use sunscreen during the day when using Vitamin C.",
      "Store in a cool, dark place to maintain potency.",
      "Results typically visible within 2-4 weeks.",
    ],
  },
  {
    id: "p4",
    slug: "essn-hydrating-moisturiser",
    name: "ESSN Hydrating Moisturiser",
    category: "Skincare",
    price: "₹799",
    priceNum: 799,
    image: "/cards/buy.jpg",
    description:
      "Lightweight hydrating moisturiser for all skin types. Locks in moisture without feeling heavy or greasy.",
    stock: 50,
    ingredients: [
      "Aqua (Water)",
      "Glycerin",
      "Hyaluronic Acid",
      "Ceramides",
      "Aloe Vera",
      "Shea Butter",
      "Vitamin E",
      "Jojoba Oil",
    ],
    howToUse: [
      "Take a coin-sized amount on your fingertips.",
      "Dot on forehead, cheeks, nose, and chin.",
      "Massage gently in upward circular motions.",
      "Allow to absorb for 1-2 minutes.",
      "Use morning and night after cleansing.",
    ],
    benefits: [
      "Deep hydration that lasts all day",
      "Non-greasy, lightweight texture",
      "Strengthens skin barrier with Ceramides",
      "Soothes and calms irritated skin",
      "Suitable for all skin types, including sensitive",
      "Prevents moisture loss and dryness",
    ],
    idealFor:
      "All skin types looking for everyday hydration — especially dry, dehydrated, or sensitive skin.",
    goodToKnow: [
      "Dermatologically tested.",
      "Fragrance-free formula.",
      "Can be used under makeup as a primer.",
    ],
  },
  {
    id: "p5",
    slug: "essn-hair-repair-mask",
    name: "ESSN Hair Repair Mask",
    category: "Hair Care",
    price: "₹699",
    priceNum: 699,
    image: "/cards/buy.jpg",
    description:
      "Deep-conditioning hair mask for damaged and dry hair. Restores shine, strength, and softness with every use.",
    stock: 35,
    ingredients: [
      "Argan Oil",
      "Keratin Protein",
      "Coconut Oil",
      "Shea Butter",
      "Vitamin E",
      "Aloe Vera Extract",
      "Biotin",
      "Panthenol (Pro-Vitamin B5)",
    ],
    howToUse: [
      "Shampoo hair and squeeze out excess water.",
      "Take an adequate amount and apply from mid-length to tips.",
      "Gently comb through for even distribution.",
      "Leave on for 5-10 minutes.",
      "Rinse thoroughly with lukewarm water.",
      "Use once or twice a week.",
    ],
    benefits: [
      "Repairs damaged and chemically treated hair",
      "Restores natural shine and softness",
      "Deeply conditions and strengthens hair",
      "Reduces frizz and split ends",
      "Keratin-enriched for structural repair",
      "Protects hair from heat damage",
    ],
    idealFor:
      "Anyone with dry, damaged, frizzy, or chemically treated hair looking to restore health and shine.",
    goodToKnow: [
      "Safe for colour-treated hair.",
      "For external use only.",
      "Avoid applying on scalp — focus on lengths and tips.",
    ],
  },
  {
    id: "p6",
    slug: "essn-professional-brush-kit",
    name: "ESSN Professional Brush Kit",
    category: "Tools & Brushes",
    price: "₹2,499",
    priceNum: 2499,
    image: "/cards/buy.jpg",
    description:
      "12-piece professional makeup brush set with travel pouch. Ultra-soft synthetic bristles for flawless application.",
    stock: 20,
    ingredients: [
      "Synthetic Taklon Bristles",
      "Aluminium Ferrule",
      "Wooden Handles",
      "Velvet Travel Pouch (Included)",
    ],
    howToUse: [
      "Use the foundation brush for liquid/cream base products.",
      "Use the powder brush for setting powders and bronzers.",
      "Use the blending brush for eyeshadow blending.",
      "Use the lip brush for precise lipstick application.",
      "Clean brushes weekly with mild brush cleanser.",
    ],
    benefits: [
      "12 essential brushes for complete makeup application",
      "Ultra-soft synthetic bristles — gentle on skin",
      "Durable wooden handles for professional grip",
      "Works with cream, liquid, and powder products",
      "Includes a premium travel pouch",
      "Cruelty-free — 100% synthetic hair",
    ],
    idealFor:
      "Makeup beginners and professionals who want a complete, high-quality brush set.",
    goodToKnow: [
      "Clean brushes regularly for hygiene and longevity.",
      "Lay flat to dry after washing — avoid soaking handles.",
      "Travel pouch included for easy portability.",
    ],
  },
  {
    id: "p7",
    slug: "essn-sunset-eau-de-parfum",
    name: "ESSN Sunset Eau de Parfum",
    category: "Fragrance",
    price: "₹1,999",
    priceNum: 1999,
    image: "/cards/buy.jpg",
    description:
      "Luxurious evening fragrance with floral and woody notes. Long-lasting scent that leaves a memorable impression.",
    stock: 15,
    ingredients: [
      "Alcohol Denat.",
      "Parfum (Fragrance)",
      "Aqua (Water)",
      "Linalool",
      "Limonene",
      "Geraniol",
      "Citronellol",
      "Coumarin",
    ],
    howToUse: [
      "Spray on pulse points — wrists, neck, behind ears.",
      "Hold the bottle 15-20 cm from skin.",
      "Apply after shower for longer-lasting scent.",
      "Avoid rubbing the sprayed area — let it dry naturally.",
      "Reapply as needed for extended occasions.",
    ],
    benefits: [
      "Sophisticated floral-woody fragrance",
      "Long-lasting — stays for 8-10 hours",
      "Perfect for evening and special occasions",
      "Premium Eau de Parfum concentration",
      "Elegant glass bottle with spray nozzle",
      "A signature scent for the modern individual",
    ],
    idealFor:
      "Anyone who loves a luxurious, long-lasting evening fragrance with floral and woody notes.",
    goodToKnow: [
      "For external use only.",
      "Store in a cool, dry place away from direct sunlight.",
      "Allergen information listed — check ingredients if sensitive.",
    ],
  },
  {
    id: "p8",
    slug: "essn-concealer-palette",
    name: "ESSN Concealer Palette",
    category: "Makeup",
    price: "₹699",
    priceNum: 699,
    image: "/cards/buy.jpg",
    description:
      "Multi-shade concealer palette for colour correction and coverage. Covers dark circles, blemishes, and redness.",
    stock: 45,
    ingredients: [
      "Mineral Oil",
      "Kaolin Clay",
      "Zinc Oxide",
      "Vitamin E",
      "Aloe Vera Extract",
      "Iron Oxides",
      "Titanium Dioxide",
    ],
    howToUse: [
      "Choose a shade close to your skin tone for concealing.",
      "Use green for redness, peach for dark circles.",
      "Apply with a small brush or fingertip.",
      "Pat gently to blend — don't rub.",
      "Set with translucent powder for all-day wear.",
    ],
    benefits: [
      "Multi-shade palette for versatile use",
      "Colour-corrects dark circles, redness, and blemishes",
      "Creamy, blendable texture",
      "Full coverage without caking",
      "Compact and travel-friendly design",
      "Enriched with Vitamin E and Aloe Vera",
    ],
    idealFor:
      "Makeup enthusiasts who want professional-grade colour correction and concealing in one palette.",
    goodToKnow: [
      "Patch test recommended for sensitive skin.",
      "Blend immediately — sets quickly.",
      "Can be used as an eyeshadow base.",
    ],
  },
  {
    id: "p9",
    slug: "essn-sunscreen-spf50",
    name: "ESSN Sunscreen SPF 50",
    category: "Skincare",
    price: "₹599",
    priceNum: 599,
    image: "/cards/buy.jpg",
    description:
      "Lightweight broad-spectrum sunscreen for daily protection. Shields skin from UVA/UVB rays without white cast.",
    stock: 60,
    ingredients: [
      "Zinc Oxide",
      "Aqua (Water)",
      "Aloe Vera",
      "Vitamin E",
      "Niacinamide",
      "Hyaluronic Acid",
      "Green Tea Extract",
      "Centella Asiatica",
    ],
    howToUse: [
      "Apply generously on face and exposed skin, 15 minutes before sun exposure.",
      "Take two finger-lengths for face and neck.",
      "Massage gently until fully absorbed.",
      "Reapply every 2-3 hours during prolonged sun exposure.",
      "Use daily — even on cloudy days.",
    ],
    benefits: [
      "Broad-spectrum SPF 50 — UVA + UVB protection",
      "No white cast — blends seamlessly",
      "Lightweight, non-greasy formula",
      "Hydrating with Hyaluronic Acid",
      "Soothes skin with Aloe Vera and Centella",
      "Suitable for daily use under makeup",
    ],
    idealFor:
      "Everyone — daily sun protection for all skin types, especially for outdoor activities and daily commutes.",
    goodToKnow: [
      "Reapply after swimming or sweating.",
      "Dermatologically tested and safe for sensitive skin.",
      "Works well as a makeup base.",
    ],
  },
];

export function findProductBySlug(slug: string): ProductDetail | undefined {
  return staticProducts.find((p) => p.slug === slug);
}

export function findProductById(id: string): ProductDetail | undefined {
  return staticProducts.find((p) => p.id === id);
}
