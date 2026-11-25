import { Link } from 'react-router';
import { footerNav } from '../app/navigation';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div>
          <p className={styles.brand}>RISE NETWORK</p>
          <p className={styles.tagline}>Opportunity. Access. Progress.</p>
        </div>
        <nav aria-label="Footer">
          <ul className={styles.links}>
            {footerNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className={styles.disclaimer}>
          RISE NETWORK links to opportunities offered by third parties. We do not guarantee
          admission, funding, employment or selection. Always apply through the official provider.
        </p>
      </div>
    </footer>
  );
}
