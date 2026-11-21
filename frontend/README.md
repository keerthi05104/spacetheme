# COSMIC DINE: Beyond Earth. Beyond Taste. Beyond Imagination.

An interactive 3D space-tourism restaurant, built with React, Vite, React Three Fiber, Drei, GSAP and Lucide.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview
```

Requires Node 18+. No backend and no image downloads: planets, ship, station and food art are generated in code.

## What is in it

| Route | Page |
|---|---|
| `#/` | Hero: 3D Earth, asteroids, nebulae, galaxy and a flying shuttle, plus teasers |
| `#/journey` | Seven-stage GSAP-animated flight: Earth, boarding, Mars, asteroid belt, Jupiter, nebula, arrival. Back/Next, autopilot, keyboard arrows, free-explore orbit camera |
| `#/planets` | Eight 3D planets with moons and rings. Hover, click, Explore planet (zoom), set destination, menu pairing |
| `#/restaurant` | 3D dining hall with arrival swoop, glass window wall, tables, clickable holographic menus and a switchable planet view |
| `#/menu` | 5 categories, search, dietary filters, add to cart, quantity controls |
| `#/checkout` | Validated form, order confirmation (no payment details collected) |
| `#/reservations` | Date, time, package, guests, planet view, live total, cancel |
| `#/dashboard` | Destination, journey progress, cart, orders with live status, reservations, preferences, theme, reset |

## Storage

- **localStorage**: `cd.cart`, `cd.orders`, `cd.reservations`, `cd.prefs` (preferences and theme), `cd.selectedPlanet`, `cd.destination`
- **sessionStorage**: `cd.journey` (progress), `cd.checkout` (draft, no payment data), `cd.nav` (current page)

Hooks: `useLocalStorage`, `useSessionStorage`, `useCart`, `useReservations`, `useOrders`, `usePreferences`, `useQuality`. Stored data is validated on read; corrupted values fall back to defaults.

## Performance and accessibility

3D density, pixel ratio and texture size adapt to the device. Rendering pauses off-screen and in hidden tabs. `prefers-reduced-motion` slows scenes and disables UI animation. The 3D pages are code-split.
