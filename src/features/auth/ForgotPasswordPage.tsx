import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { TextField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import { getSupabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/usePageTitle';
import { AccountsUnavailable } from './AccountsUnavailable';
import { validate } from '../../lib/validation';
import { emailOnlySchema } from './schemas';

export function ForgotPasswordPage() {
  usePageTitle('Reset your password');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = getSupabase();
  if (!supabase) return <AccountsUnavailable />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const result = validate(emailOnlySchema, {
      email: String(new FormData(event.currentTarget).get('email') ?? ''),
    });
    if (result.errors) {
      setEmailError(result.errors.email);
      return;
    }
    setEmailError(undefined);
    setSubmitting(true);
    // The outcome is deliberately not shown, so the page does not reveal registered emails.
    await supabase.auth.resetPasswordForEmail(result.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    setSent(true);
  }

  return (
    <div className="container prose">
      <h1>Reset your password</h1>
      {sent ? (
        <FormStatus kind="success">
          <p>
            If an account exists for that email address, we have sent a link to reset the password.
            The link expires after a short time.
          </p>
        </FormStatus>
      ) : (
        <form
          className={formStyles.form}
          onSubmit={onSubmit}
          noValidate
          aria-label="Reset your password"
        >
          <TextField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={emailError}
          />
          <div className={formStyles.actions}>
            <button
              type="submit"
              className="button button--primary"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </div>
        </form>
      )}
      <p style={{ marginTop: 'var(--space-6)' }}>
        <Link to="/sign-in">Back to sign in</Link>
      </p>
    </div>
  );
}
