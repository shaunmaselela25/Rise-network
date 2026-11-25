import type { ReactNode } from 'react';
import styles from './Form.module.css';

interface FormStatusProps {
  kind: 'error' | 'success';
  children: ReactNode;
}

/** Form-level message. Errors are announced assertively; success politely. */
export function FormStatus({ kind, children }: FormStatusProps) {
  return (
    <div
      className={kind === 'error' ? styles.statusError : styles.statusSuccess}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
