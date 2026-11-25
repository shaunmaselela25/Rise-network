import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckboxField, SelectField, TextField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import {
  provinceLabels,
  qualificationLabels,
  type Province,
  type QualificationLevel,
} from '../../lib/reference';
import { getSupabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/usePageTitle';
import { useAuth } from '../auth/authContext';
import { validate } from '../../lib/validation';
import { profileSchema, provinces, qualifications } from './profileSchema';

interface Profile {
  display_name: string;
  province: Province | null;
  education_level: QualificationLevel | null;
}

type LoadState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; profile: Profile };

export function AccountPage() {
  usePageTitle('My account');
  const { session } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user.id;
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
  const [nameError, setNameError] = useState<string | undefined>();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle');

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    let active = true;
    supabase
      .from('profiles')
      .select('display_name, province, education_level')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        setLoad(error || !data ? { kind: 'error' } : { kind: 'ready', profile: data });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    const form = new FormData(event.currentTarget);
    const result = validate(profileSchema, {
      displayName: String(form.get('displayName') ?? ''),
      province: String(form.get('province') ?? ''),
      educationLevel: String(form.get('educationLevel') ?? ''),
    });
    if (result.errors) {
      setNameError(result.errors.displayName);
      return;
    }
    setNameError(undefined);
    setSaveStatus('saving');
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: result.data.displayName,
        province: result.data.province || null,
        education_level: result.data.educationLevel || null,
      })
      .eq('id', userId);
    setSaveStatus(error ? 'error' : 'saved');
  }

  async function onSignOut() {
    await getSupabase()?.auth.signOut();
    navigate('/', { replace: true });
  }

  async function onDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase || !deleteConfirmed) return;
    setDeleteStatus('deleting');
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      setDeleteStatus('error');
      return;
    }
    await supabase.auth.signOut({ scope: 'local' });
    navigate('/account-deleted', { replace: true });
  }

  return (
    <div className="container prose">
      <h1>My account</h1>
      <p>
        Signed in as <strong>{session?.user.email}</strong>
      </p>

      <nav aria-label="Your activity" style={{ marginBottom: 'var(--space-6)' }}>
        <ul>
          <li>
            <Link to="/saved">Saved opportunities</Link>
          </li>
          <li>
            <Link to="/my-submissions">My submissions</Link>
          </li>
          <li>
            <Link to="/submit">Submit an opportunity</Link>
          </li>
        </ul>
      </nav>

      <section aria-labelledby="profile-heading">
        <h2 id="profile-heading">Profile</h2>
        {load.kind === 'loading' && <p role="status">Loading your profile…</p>}
        {load.kind === 'error' && (
          <FormStatus kind="error">
            <p>We could not load your profile. Please refresh the page to try again.</p>
          </FormStatus>
        )}
        {load.kind === 'ready' && (
          <form
            className={formStyles.form}
            onSubmit={onSaveProfile}
            noValidate
            aria-label="Profile"
          >
            {saveStatus === 'saved' && (
              <FormStatus kind="success">
                <p>Your profile has been saved.</p>
              </FormStatus>
            )}
            {saveStatus === 'error' && (
              <FormStatus kind="error">
                <p>We could not save your profile. Please try again.</p>
              </FormStatus>
            )}
            <TextField
              label="Name to display"
              name="displayName"
              defaultValue={load.profile.display_name}
              maxLength={80}
              required
              error={nameError}
            />
            <SelectField
              label="Province"
              name="province"
              defaultValue={load.profile.province ?? ''}
              placeholder="Prefer not to say"
              hint="Helps us show opportunities near you. You can leave this blank."
              options={provinces.map((value) => ({ value, label: provinceLabels[value] }))}
            />
            <SelectField
              label="Highest qualification"
              name="educationLevel"
              defaultValue={load.profile.education_level ?? ''}
              placeholder="Prefer not to say"
              options={qualifications.map((value) => ({
                value,
                label: qualificationLabels[value],
              }))}
            />
            <div className={formStyles.actions}>
              <button
                type="submit"
                className="button button--primary"
                disabled={saveStatus === 'saving'}
                aria-busy={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section aria-labelledby="session-heading" style={{ marginTop: 'var(--space-7)' }}>
        <h2 id="session-heading">Sign out</h2>
        <button type="button" className="button button--secondary" onClick={onSignOut}>
          Sign out
        </button>
      </section>

      <section aria-labelledby="delete-heading" style={{ marginTop: 'var(--space-7)' }}>
        <h2 id="delete-heading">Delete your account</h2>
        <p>
          This permanently deletes your account, profile and saved opportunities. Opportunities you
          submitted that were published stay on RISE NETWORK, but are no longer linked to you. This
          cannot be undone.
        </p>
        {deleteStatus === 'error' && (
          <FormStatus kind="error">
            <p>We could not delete your account. Please try again or contact us.</p>
          </FormStatus>
        )}
        <form
          className={formStyles.form}
          onSubmit={onDeleteAccount}
          aria-label="Delete your account"
        >
          <CheckboxField
            name="confirmDelete"
            label="I understand that deleting my account is permanent."
            checked={deleteConfirmed}
            onChange={(event) => setDeleteConfirmed(event.currentTarget.checked)}
          />
          <div className={formStyles.actions}>
            <button
              type="submit"
              className="button button--danger"
              disabled={!deleteConfirmed || deleteStatus === 'deleting'}
              aria-busy={deleteStatus === 'deleting'}
            >
              {deleteStatus === 'deleting' ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
