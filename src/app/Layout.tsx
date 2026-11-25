import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { AuthProvider } from '../features/auth/AuthProvider';
import styles from './Layout.module.css';

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  // On client-side navigation, move focus to <main> so screen-reader and keyboard
  // users land on the new content, and reset scroll. Skip on initial load.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <AuthProvider>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#main-content">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content" ref={mainRef} tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </AuthProvider>
  );
}
