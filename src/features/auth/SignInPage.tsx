import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { TextField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import { getSupabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/usePageTitle';
import { AccountsUnavailable } from './AccountsUnavailable';
import { useAuth } from './authContext';
import { validate, type FieldErrors } from '../../lib/validation';
import { safeNextPath, signInSchema } from './schemas';

export function SignInPage() {
  usePageTitle('Sign in');
  const { status } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const [errors, setErrors] = useState<FieldErrors<{ email: string; password: string }>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const supabase = getSupabase();
  if (!supabase) return <AccountsUnavailable />;
  if (status === 'signed_in') return <Navigate to={next} replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const result = validate(signInSchema, {
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    });
    setFormError(null);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(result.data);
    setSubmitting(false);
    if (error) {
      // Generic message: does not reveal whether the account exists.
      setFormError(
        'We could not sign you in. Check your email and password, and make sure you have confirmed your email address.',
      );
      return;
    }
    navigate(next, { replace: true });
  }

  return (
    <div className="container prose">
      <h1>Sign in</h1>
      {formError && <FormStatus kind="error">{formError}</FormStatus>}
      <form className={formStyles.form} onSubmit={onSubmit} noValidate aria-label="Sign in">
        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={errors.email}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <div className={formStyles.actions}>
          <button
            type="submit"
            className="button button--primary"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>
      </form>
      <p style={{ marginTop: 'var(--space-6)' }}>
        New to RISE NETWORK? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
