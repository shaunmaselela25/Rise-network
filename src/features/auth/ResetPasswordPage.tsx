import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { TextField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import { getSupabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/usePageTitle';
import { AccountsUnavailable } from './AccountsUnavailable';
import { useAuth } from './authContext';
import { validate, type FieldErrors } from '../../lib/validation';
import { PASSWORD_MIN_LENGTH, newPasswordSchema } from './schemas';

/**
 * Landing page for the password-reset email link. Supabase exchanges the link's code for a
 * short-lived recovery session; the user then sets a new password.
 */
export function ResetPasswordPage() {
  usePageTitle('Choose a new password');
  const { status } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<FieldErrors<{ password: string; confirmPassword: string }>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const supabase = getSupabase();
  if (!supabase) return <AccountsUnavailable />;

  if (status === 'loading') {
    return (
      <div className="container" role="status">
        Loading…
      </div>
    );
  }

  if (status !== 'signed_in') {
    return (
      <div className="container prose">
        <h1>Choose a new password</h1>
        <FormStatus kind="error">
          <p>This password reset link is invalid or has expired.</p>
        </FormStatus>
        <p>
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const result = validate(newPasswordSchema, {
      password: String(form.get('password') ?? ''),
      confirmPassword: String(form.get('confirmPassword') ?? ''),
    });
    setFormError(null);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: result.data.password });
    setSubmitting(false);
    if (error) {
      setFormError('We could not update your password. Please request a new reset link.');
      return;
    }
    navigate('/account', { replace: true });
  }

  return (
    <div className="container prose">
      <h1>Choose a new password</h1>
      {formError && <FormStatus kind="error">{formError}</FormStatus>}
      <form
        className={formStyles.form}
        onSubmit={onSubmit}
        noValidate
        aria-label="Choose a new password"
      >
        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint={`At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`}
          error={errors.password}
        />
        <TextField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
        />
        <div className={formStyles.actions}>
          <button
            type="submit"
            className="button button--primary"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Saving…' : 'Save new password'}
          </button>
        </div>
      </form>
    </div>
  );
}
