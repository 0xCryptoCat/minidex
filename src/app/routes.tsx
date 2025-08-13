import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import Chart from '../pages/Chart';

const Home = lazy(() => import('../pages/Home'));
const Lists = lazy(() => import('../pages/Lists'));

export const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/t/:chain/:address/:pairId?', element: <Chart /> },
  { path: '/lists/:chain/:type', element: <Lists /> },
];
