import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import Chart from '../pages/Chart';

const Home = lazy(() => import('../pages/Home'));
const Lists = lazy(() => import('../pages/Lists'));
const TestAPIPage = lazy(() => import('../pages/TestAPIPage'));
const DebugSearchPage = lazy(() => import('../pages/DebugSearchPage'));

export const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/t/:chain/:address/:pairId?', element: <Chart /> },
  { path: '/lists/:chain/:type', element: <Lists /> },
  { path: '/test-api', element: <TestAPIPage /> },
  { path: '/debug-search', element: <DebugSearchPage /> },
]