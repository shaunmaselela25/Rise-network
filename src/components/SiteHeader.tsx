import { useEffect, useId, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { primaryNav } from '../app/navigation';
import { isStaff, useAuth } from '../features/auth/authContext';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const menuId = useId();
  const { status, roles } = useAuth();
  // Only show account links when accounts actually exist in this environment.
  const accountLinks =
    status === 'signed_in'
      ? [
          { to: '/saved', label: 'Saved' },
          ...(isStaff(roles) ? [{ to: '/moderation', label: 'Moderation' }] : []),
          { to: '/account', label: 'My account' },
        ]
      : status === 'signed_out'
        ? [{ to: '/sign-in', label: 'Sign in' }]
        : [];
  const navItems = [...primaryNav, ...accountLinks];

  // Close the mobile menu whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link to="/" className={styles.brand}>
          RISE NETWORK
        </Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>
        <nav
          id={menuId}
          aria-label="Main"
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
        >
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
