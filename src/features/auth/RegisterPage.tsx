import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { CheckboxField, TextField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../../lib/policies';
import { getSupabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/usePageTitle';
import { AccountsUnavailable } from './AccountsUnavailable';
import { validate, type FieldErrors } from '../../lib/validation';
import { PASSWORD_MIN_LENGTH, registrationSchema } from './schemas';

type RegistrationInput = {
  displayName: string;
  email: string;
  password: string;
  ageConfirmed: boolean;
  policiesAccepted: boolean;
};

export function RegisterPage() {
  usePageTitle('Create an account');
  const [errors, setErrors] = useState<FieldErrors<RegistrationInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supabase = getSupabase();
  if (!supabase) return <AccountsUnavailable />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const result = validate(registrationSchema, {
      displayName: String(form.get('displayName') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      ageConfirmed: form.get('ageConfirmed') === 'on',
      policiesAccepted: form.get('policiesAccepted') === 'on',
    });
    setFormError(null);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/sign-in`,
        data: {
          display_name: result.data.displayName,
          age_confirmed: true,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_NOTICE_VERSION,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      setFormError(
        error.code === 'weak_password'
          ? 'Please choose a stronger password.'
          : 'We could not create your account. Please check your details and try again.',
      );
      return;
    }
    // Same message whether or not the address was already registered (prevents enumeration).
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="container prose">
        <h1>Check your email</h1>
        <FormStatus kind="success">
          <p>
            If this email address can be used for a new account, we have sent a confirmation link to
            it. Open the link to activate your account, then sign in.
          </p>
        </FormStatus>
        <p>
          <Link to="/sign-in">Go to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container prose">
      <h1>Create an account</h1>
      <p className="lead">
        An account lets you save opportunities and submit opportunities for review. You do not need
        an account to browse.
      </p>
      {formError && <FormStatus kind="error">{formError}</FormStatus>}
      <form
        className={formStyles.form}
        onSubmit={onSubmit}
        noValidate
        aria-label="Create an account"
      >
        <TextField
          label="Name to display"
          name="displayName"
          autoComplete="nickname"
          maxLength={80}
          required
          error={errors.displayName}
        />
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
          autoComplete="new-password"
          required
          hint={`At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`}
          error={errors.password}
        />
        <CheckboxField
          name="ageConfirmed"
          label="I confirm that I am 18 years or older."
          hint="Accounts are currently available to people aged 18 and over. Anyone can browse without an account."
          error={errors.ageConfirmed}
        />
        <CheckboxField
          name="policiesAccepted"
          label={
            <>
              I accept the <Link to="/terms">terms of use</Link> and have read the{' '}
              <Link to="/privacy">privacy notice</Link>.
            </>
          }
          error={errors.policiesAccepted}
        />
        <div className={formStyles.actions}>
          <button
            type="submit"
            className="button button--primary"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
          <Link to="/sign-in">I already have an account</Link>
        </div>
      </form>
    </div>
  );
}
