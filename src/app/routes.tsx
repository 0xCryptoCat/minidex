import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const Home = lazy(() => import('../pages/Home'));
const Chart = lazy(() => import('../pages/Chart'));
const Lists = lazy(() => import('../pages/Lists'));

export const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/t/:chain/:address/:pairId?', element: <Chart /> },
  { path: '/lists/:chain/:type', element: <Lists /> },
];
