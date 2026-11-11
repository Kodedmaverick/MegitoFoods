// Product data. When the price document arrives, fill price / sellingUnit / packSize on each product or variation.
const V = (names) => names.map(n => ({ id: n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: n, price: null, sellingUnit: null, packSize: null }));
const P = (o) => ({ variations: [], packSize: null, sellingUnit: null, price: null, availability: 'to-confirm', illustrative: false, image: null, alt: '', ...o });
export const ASK = 'Contact us for available options, pack sizes, and business supply pricing.';
export const PRODUCTS = [
  P({ id: 'chicken-laps', name: 'Chicken laps', category: 'chicken', description: 'Frozen chicken laps. ' + ASK, image: '/assets/chicken.png', alt: 'Frozen chicken portions in a wrapped white tray', illustrative: true, variations: V(['Soft Chicken', 'Hard Chicken', 'Orobo']) }),
  P({ id: 'chicken-wings', name: 'Chicken wings', category: 'chicken', description: 'Frozen chicken wings. ' + ASK }),
  P({ id: 'chicken-breast', name: 'Chicken breast', category: 'chicken', description: 'Frozen chicken breast. ' + ASK }),
  P({ id: 'whole-chicken', name: 'Whole chicken', category: 'chicken', description: 'Frozen whole chicken. ' + ASK }),
  P({ id: 'gizzard', name: 'Chicken gizzard', category: 'chicken', description: 'Frozen chicken gizzard. ' + ASK, image: '/assets/gizzard.png', alt: 'Frozen chicken gizzards in a wrapped white tray', illustrative: true }),
  P({ id: 'croaker', name: 'Croaker', category: 'fish', description: 'Frozen croaker. ' + ASK }),
  P({ id: 'mackerel', name: 'Mackerel', category: 'fish', description: 'Frozen mackerel. ' + ASK }),
  P({ id: 'kote', name: 'Kote', category: 'fish', description: 'Frozen Kote. ' + ASK }),
  P({ id: 'hake', name: 'Hake', category: 'fish', description: 'Frozen hake. ' + ASK }),
  P({ id: 'whole-fish', name: 'Whole frozen fish', category: 'fish', description: 'Whole fish, frozen. Ask us which varieties are available.', image: '/assets/frozen-whole-fish.jpg', alt: 'Whole frozen fish in a chest freezer' }),
  P({ id: 'frozen-shrimps', name: 'Frozen shrimps', category: 'seafood', description: 'Peeled shrimps, frozen and packed.', image: '/assets/frozen-shrimps.jpg', alt: 'Four trays of packed frozen shrimps', packSize: '0.25 kg · 0.5 kg · 1 kg' }),
  P({ id: 'prawns', name: 'Jumbo and medium prawns', category: 'seafood', description: 'Peeled jumbo prawns and white medium prawns, frozen in trays.', image: '/assets/prawns-packs.jpg', alt: 'Trays of frozen peeled jumbo and white medium prawns', packSize: '0.25 kg · 0.5 kg · 1 kg' }),
  P({ id: 'crab', name: 'Crab', category: 'seafood', description: 'Crab. ' + ASK, image: '/assets/hero-crab-lobster.jpg', alt: 'Whole crabs on crushed ice', imagePos: '20% 50%' }),
  P({ id: 'croaker-chunks', name: 'Croaker chunk fish', category: 'fish', description: 'Croaker cut into chunks, frozen and tray-packed.', image: '/assets/croaker-chunks.jpg', alt: 'Tray of frozen croaker chunks', packSize: '1 kg' }),
  P({ id: 'sole-pan-ready', name: 'Sole, pan ready', category: 'fish', description: 'Sole fillets prepared for the pan, frozen and tray-packed.', image: '/assets/sole-pan-ready.jpg', alt: 'Tray of frozen pan-ready sole fillets', packSize: '1 kg' }),
  P({ id: 'snails', name: 'Snails', category: 'seafood', description: 'Cleaned snails, frozen and tray-packed.', image: '/assets/snails.jpg', alt: 'Two trays of packed cleaned snails', availability: 'pending' }),
  P({ id: 'beef-sausage', name: 'Beef sausage', category: 'sausages', description: 'Frozen beef sausage. ' + ASK, image: '/assets/sausages.png', alt: 'Frozen sausages arranged in a wrapped white tray', illustrative: true }),
  P({ id: 'chicken-sausage', name: 'Chicken sausage', category: 'sausages', description: 'Frozen chicken sausage. ' + ASK, image: '/assets/sausages.png', alt: 'Frozen sausages arranged in a wrapped white tray', illustrative: true })
];
export const CATS = [{ id: 'all', label: 'All products', icon: 'layout-grid' }, { id: 'fish', label: 'Fish', icon: 'fish' }, { id: 'chicken', label: 'Chicken', icon: 'drumstick' }, { id: 'seafood', label: 'Seafood', icon: 'shrimp' }, { id: 'sausages', label: 'Sausages', icon: 'utensils' }];
