import { Suspense, lazy, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Toasts from './components/Toasts';
import Loader from './components/Loader';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import NotFound from './pages/NotFound';

// The three heavy 3D pages are code-split so the landing page stays quick.
const Journey = lazy(() => import('./pages/Journey'));
const Planets = lazy(() => import('./pages/Planets'));
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'));

const ROUTES = {
  '/': { Page: Home, title: 'The Ultimate Space Restaurant' },
  '/journey': { Page: Journey, title: 'Space Journey', immersive: true },
  '/planets': { Page: Planets, title: 'Explore Planets', immersive: true },
  '/restaurant': { Page: RestaurantPage, title: 'The Restaurant', immersive: true },
  '/menu': { Page: Menu, title: 'Menu' },
  '/reservations': { Page: Reservations, title: 'Reservations' },
  '/checkout': { Page: Checkout, title: 'Checkout' },
  '/dashboard': { Page: Dashboard, title: 'My Orders' },
  '/orders': { Page: Dashboard, title: 'My Orders' },
};

function Shell() {
  const { route } = useApp();
  const match = ROUTES[route.path] || { Page: NotFound, title: 'Lost in space' };
  const { Page } = match;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = `${match.title} · COSMIC DINE`;
  }, [route.path, match.title]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Navbar />
      <main id="main" className={match.immersive ? 'main-immersive' : ''} key={route.path}>
        <ErrorBoundary key={route.path} message="This page hit turbulence.">
          <Suspense fallback={<Loader fullscreen label="Plotting your course…" />}>
            <div className="page-enter">
              <Page />
            </div>
          </Suspense>
        </ErrorBoundary>
      </main>
      {route.path !== '/journey' && <Footer />}
      <Cart />
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
