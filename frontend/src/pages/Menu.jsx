import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, Orbit, Moon, Wine, Rocket, LayoutGrid, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import FoodCard from '../components/FoodCard';
import Reveal from '../components/Reveal';
import { CATEGORIES, DIETARY_TAGS, FOOD_ITEMS, formatPrice } from '../data/foodItems';

const ICONS = { Sparkles, Orbit, Moon, Wine, Rocket };
const validCat = (c) => (CATEGORIES.some((x) => x.id === c) ? c : 'all');

export default function Menu() {
  const { route, cart, setCartOpen, preferences } = useApp();
  const [cat, setCat] = useState(validCat(route.query.cat));
  const [q, setQ] = useState('');
  const [diet, setDiet] = useState([]);

  useEffect(() => setCat(validCat(route.query.cat)), [route.query.cat]);

  const toggleDiet = (id) => setDiet((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return FOOD_ITEMS.filter(
      (f) =>
        (cat === 'all' || f.category === cat) &&
        diet.every((t) => f.tags?.includes(t)) &&
        (!term || f.name.toLowerCase().includes(term) || f.description.toLowerCase().includes(term))
    );
  }, [cat, q, diet]);

  const groups = CATEGORIES.map((c) => ({ c, items: filtered.filter((f) => f.category === c.id) })).filter((g) => g.items.length);
  const myDiet = preferences.prefs.dietary.filter((d) => DIETARY_TAGS.some((t) => t.id === d));

  return (
    <section className="page-pad container">
      <header className="page-head">
        <span className="eyebrow">Galactic menu</span>
        <h1 className="page-title">Taste the cosmos</h1>
        <p className="muted">Five menus, one galaxy. Everything here can be added to your cart and ordered to your table.</p>
      </header>

      <div className="menu-toolbar glass">
        <div className="tab-row" role="tablist" aria-label="Menu categories">
          <button type="button" role="tab" aria-selected={cat === 'all'} className={`tab ${cat === 'all' ? 'is-on' : ''}`} onClick={() => setCat('all')}>
            <LayoutGrid size={16} /> All
          </button>
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon] || Sparkles;
            return (
              <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={`tab ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}>
                <Icon size={16} /> {c.short}
              </button>
            );
          })}
        </div>
        <div className="filter-row">
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder="Search dishes…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search dishes" />
          </label>
          <div className="chip-row">
            {DIETARY_TAGS.map((t) => (
              <button key={t.id} type="button" className={`chip ${diet.includes(t.id) ? 'is-on' : ''}`} onClick={() => toggleDiet(t.id)} aria-pressed={diet.includes(t.id)}>
                {t.label}
              </button>
            ))}
            {myDiet.length > 0 && (
              <button type="button" className="chip chip-ghost" onClick={() => setDiet(myDiet)}>Use my preferences</button>
            )}
            {(diet.length > 0 || q) && (
              <button type="button" className="chip chip-ghost" onClick={() => { setDiet([]); setQ(''); }}>Clear filters</button>
            )}
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state glass">
          <h3>No dishes match those filters</h3>
          <p className="muted">Try removing a dietary filter or searching for something else.</p>
          <button type="button" className="btn btn-glass btn-sm" onClick={() => { setDiet([]); setQ(''); setCat('all'); }}>Reset filters</button>
        </div>
      ) : (
        groups.map(({ c, items }) => (
          <section key={c.id} className="menu-group" aria-labelledby={`cat-${c.id}`}>
            <Reveal className="menu-group-head" style={{ '--h': c.hue }}>
              <h2 id={`cat-${c.id}`}>{c.name}</h2>
              <span>{c.tagline}</span>
            </Reveal>
            <div className="card-grid">
              {items.map((item) => <FoodCard key={item.id} item={item} />)}
            </div>
          </section>
        ))
      )}

      {cart.count > 0 && (
        <button type="button" className="cart-bar btn btn-primary" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={18} /> View cart · {cart.count} item{cart.count === 1 ? '' : 's'} · {formatPrice(cart.total)}
        </button>
      )}
    </section>
  );
}
