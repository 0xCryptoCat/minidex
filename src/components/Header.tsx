import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <button className="menu-btn" aria-label="Menu">☰</button>
      <Link to="/" className="search-pill">Search</Link>
    </header>
  );
}
