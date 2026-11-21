// Reservation options: dining packages, planet-view experiences and time slots.

export const PACKAGES = [
  {
    id: 'orbital-classic',
    name: 'Orbital Classic',
    price: 149,
    duration: '90 min',
    summary: 'Three-course dinner at a window table with a live planet view.',
    includes: ['3-course menu', 'Welcome Nebula Spritz', 'Window seating'],
  },
  {
    id: 'nebula-tasting',
    name: 'Nebula Tasting',
    price: 289,
    duration: '150 min',
    summary: 'Seven-course chef tasting menu with a full beverage pairing.',
    includes: ['7-course tasting', 'Sommelier pairing', 'Chef table greeting'],
    popular: true,
  },
  {
    id: 'zero-g-gala',
    name: 'Zero-G Gala',
    price: 499,
    duration: '3 hrs',
    summary: 'Private pod, nine courses, a zero-g dessert flight and a station tour.',
    includes: ['Private pod', '9 courses', 'Zero-G dessert', 'Station tour'],
  },
  {
    id: 'little-astronaut',
    name: 'Little Astronaut',
    price: 99,
    duration: '75 min',
    summary: 'A playful three-course meal for young explorers, with a mission badge.',
    includes: ['Kids 3-course menu', 'Mission badge', 'Junior cockpit visit'],
  },
];

export const VIEWS = [
  {
    id: 'earthrise',
    name: 'Earthrise Terrace',
    planetId: 'earth',
    surcharge: 0,
    blurb: 'Blue oceans and swirling cloud, rising over the horizon.',
    colors: ['#1d4f91', '#5db8ff'],
  },
  {
    id: 'mars-sunset',
    name: 'Mars Sunset Lounge',
    planetId: 'mars',
    surcharge: 20,
    blurb: 'Rust-red dunes with a glowing blue sunset.',
    colors: ['#7a2f18', '#ff9a6b'],
  },
  {
    id: 'saturn-rings',
    name: 'Saturn Rings Room',
    planetId: 'saturn',
    surcharge: 35,
    blurb: 'Dine just above the glittering ice rings.',
    colors: ['#8a6a2d', '#ffe0a3'],
  },
  {
    id: 'neptune-blue',
    name: 'Neptune Blue Hall',
    planetId: 'neptune',
    surcharge: 25,
    blurb: 'Deep sapphire light across the entire hall.',
    colors: ['#14307a', '#6b9bff'],
  },
  {
    id: 'nebula-aurora',
    name: 'Nebula Aurora Window',
    planetId: 'aetheria',
    surcharge: 30,
    blurb: 'A violet storm world glowing beyond the nebula.',
    colors: ['#3a1a8a', '#c58bff'],
  },
];

export const TIME_SLOTS = ['17:00', '18:30', '20:00', '21:30', '23:00'];

export const PACKAGE_BY_ID = Object.fromEntries(PACKAGES.map((p) => [p.id, p]));
export const VIEW_BY_ID = Object.fromEntries(VIEWS.map((v) => [v.id, v]));

// Deterministic "availability" so the demo feels real but stays testable.
export function isSlotSoldOut(date, time) {
  const str = `${date}|${time}`;
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 7 === 0;
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateLong(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
