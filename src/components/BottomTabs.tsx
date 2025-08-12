import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  { view: 'detail', label: 'Detail' },
  { view: 'chart', label: 'Chart' },
  { view: 'chart-txs', label: 'Chart+TXs' },
  { view: 'txs', label: 'TXs' },
];

export default function BottomTabs() {
  const location = useLocation();
  const { pathname, search } = location;
  const qs = new URLSearchParams(search);

  return (
    <nav className="bottom-tabs">
      {tabs.map((tab) => {
        qs.set('view', tab.view);
        const to = `${pathname}?${qs.toString()}`;
        return (
          <NavLink key={tab.view} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {tab.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
