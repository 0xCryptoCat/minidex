import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { routes } from './routes';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { ProviderProvider } from '../lib/provider';

function Shell() {
  const location = useLocation();
  const showTabs = location.pathname.startsWith('/t/');

  useEffect(() => {
    if (location.pathname === '/') {
      document.body.classList.add('home-no-header');
    } else {
      document.body.classList.remove('home-no-header');
    }
  }, [location.pathname]);

  return (
    <>
      <Header />
      <main className={`${showTabs ? 'with-tabs' : ''}`}>
        <Suspense fallback={<div />}>
          <Routes>
            {routes.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Routes>
        </Suspense>
      </main>
      {showTabs && <BottomTabs />}
    </>
  );
}

export default function App() {
  return (
    <ProviderProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </ProviderProvider>
  );
}
