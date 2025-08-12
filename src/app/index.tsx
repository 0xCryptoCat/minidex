import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { routes } from './routes';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';

function Shell() {
  const location = useLocation();
  const showTabs = location.pathname.startsWith('/t/');

  return (
    <>
      <Header />
      <main className={showTabs ? 'with-tabs' : ''}>
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
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
