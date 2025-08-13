import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { view: 'chart', label: 'Chart' },
  { view: 'depth', label: 'Chart + Trades' },
  { view: 'trades', label: 'Trades' },
  { view: 'detail', label: 'Detail' },
];

export default function BottomTabs() {
  const location = useLocation();
  const { pathname, search } = location;
  const currentView = new URLSearchParams(search).get('view') || 'chart';

  return (
    <nav className="bottom-tabs" role="tablist" aria-label="Views">
      {tabs.map((tab) => {
        const qs = new URLSearchParams(search);
        qs.set('view', tab.view);
        const to = `${pathname}?${qs.toString()}`;
        const isActive = currentView === tab.view;
        return (
          <Link
            key={tab.view}
            to={to}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={isActive ? 'active' : ''}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
