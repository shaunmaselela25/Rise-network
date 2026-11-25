import { FormStatus } from './form/FormStatus';

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <FormStatus kind="error">
      <p>{message}</p>
      <button type="button" className="button button--secondary" onClick={onRetry}>
        Try again
      </button>
    </FormStatus>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <p role="status" style={{ paddingBlock: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
      {label}
    </p>
  );
}
