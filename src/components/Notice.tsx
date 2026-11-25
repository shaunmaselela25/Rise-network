import type { ReactNode } from 'react';
import styles from './Notice.module.css';

interface NoticeProps {
  title: string;
  children: ReactNode;
}

/** Non-urgent, informational notice. */
export function Notice({ title, children }: NoticeProps) {
  return (
    <aside className={styles.notice} aria-label={title}>
      <p className={styles.title}>{title}</p>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
